from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import json
import base64
import traceback
import logging

from ..database import get_db
from ..models import ApiKey, Schedule
from ..schemas import VoiceProcessRequest, VoiceProcessResponse, ExtractedInfo, VoiceResult, ScheduleOut
from ..routers.auth import verify_token
from ..routers.schedules import get_user_id
from ..routers.keys import decrypt_key

logger = logging.getLogger("voice")

router = APIRouter()

NLP_SYSTEM_PROMPT = """你是「言程」智能日程助手的 NLP 解析模块。用户会通过语音输入一段自然语言，你需要从中提取日程相关信息。

请分析用户的意图，并提取以下信息：
- intent: 意图类型，取值为 create（创建日程）、query（查询日程）、modify（修改日程）、delete（删除日程）、unknown（无法识别）
- title: 事件标题
- datetime: 时间（ISO 8601 格式，如 2026-06-17T15:00:00）
- location: 地点
- description: 描述
- confirm_required: 是否需要用户确认（创建和修改时为 true）

【重要】只返回一个 JSON 对象，不要返回任何其他文字、解释或 markdown 代码块。

示例：
用户："帮我记一下，明天下午三点在星巴克和李总谈合同"
返回：{{"intent": "create", "title": "和李总谈合同", "datetime": "2026-06-17T15:00:00", "location": "星巴克", "description": null, "confirm_required": true}}

用户："我今天下午有什么安排？"
返回：{{"intent": "query", "title": null, "datetime": "2026-06-16T12:00:00", "location": null, "description": null, "confirm_required": false}}

用户："把刚才那个会议推迟半小时"
返回：{{"intent": "modify", "title": null, "datetime": null, "location": null, "description": "推迟30分钟", "confirm_required": true}}

用户："取消明天上午的所有日程"
返回：{{"intent": "delete", "title": null, "datetime": "2026-06-17T09:00:00", "location": null, "description": "删除上午所有日程", "confirm_required": true}}

当前日期时间：{current_time}
"""


@router.post("/process", response_model=VoiceProcessResponse)
async def process_voice(
    req: VoiceProcessRequest,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    transcript = ""
    intent = "unknown"
    extracted = ExtractedInfo()
    confirm_required = False
    result = None

    try:
        # 获取 API 配置：优先使用请求中的，否则从数据库读取
        config = req.api_config
        if not config or not config.api_key:
            # 从数据库读取
            db_key = await db.execute(select(ApiKey).where(ApiKey.user_id == user_id))
            key_record = db_key.scalar_one_or_none()
            if key_record:
                from ..schemas import ApiKeyConfig
                config = ApiKeyConfig(
                    api_url=key_record.api_url,
                    api_key=decrypt_key(key_record.encrypted_key),
                    model_name=key_record.model_name,
                )

        # 1. 获取文本
        if req.text_input:
            transcript = req.text_input
        elif config and config.api_key and req.audio_base64:
            transcript = await call_asr(req.audio_base64, config)
        else:
            transcript = "（请输入文字或配置 API Key 后使用语音）"

        # 2. NLP 意图解析
        if config and config.api_key and transcript:
            nlp_result = await call_nlp(transcript, config)
            if not isinstance(nlp_result, dict):
                nlp_result = {"intent": "unknown", "description": f"NLP 返回格式异常: {str(nlp_result)[:100]}"}
            intent = nlp_result.get("intent", "unknown")
            extracted = ExtractedInfo(
                title=nlp_result.get("title"),
                datetime=nlp_result.get("datetime"),
                location=nlp_result.get("location"),
                description=nlp_result.get("description"),
            )
            confirm_required = nlp_result.get("confirm_required", False)

        # 3. 根据意图执行操作
        if intent == "query":
            from datetime import datetime, timedelta

            target_date = datetime.now()
            if extracted.datetime:
                target_date = datetime.fromisoformat(extracted.datetime)

            next_day = target_date + timedelta(days=1)
            query = select(Schedule).where(
                Schedule.user_id == user_id,
                Schedule.start_time >= target_date,
                Schedule.start_time < next_day,
            ).order_by(Schedule.start_time)
            db_result = await db.execute(query)
            events = db_result.scalars().all()

            result = VoiceResult(
                events=[
                    ScheduleOut(
                        id=e.id, user_id=e.user_id, title=e.title,
                        description=e.description, location=e.location,
                        start_time=e.start_time.isoformat(),
                        end_time=e.end_time.isoformat() if e.end_time else None,
                        reminder_minutes=e.reminder_minutes,
                        created_at=e.created_at.isoformat() if e.created_at else "",
                        updated_at=e.updated_at.isoformat() if e.updated_at else "",
                    ) for e in events
                ]
            )

    except Exception as e:
        logger.error(f"voice process 异常: {traceback.format_exc()}")
        intent = "unknown"
        extracted = ExtractedInfo(description=f"处理出错: {str(e)}")

    return VoiceProcessResponse(
        transcript=transcript if transcript else "（未获取到文本）",
        intent=intent,
        extracted=extracted,
        result=result,
        confirm_required=confirm_required,
    )


async def call_asr(audio_base64: str, config) -> str:
    """调用 ASR API（Whisper）"""
    audio_bytes = base64.b64decode(audio_base64)
    api_url = (config.api_url or "https://api.openai.com/v1").rstrip("/")
    api_key = config.api_key
    model = config.model_name  # 必须由用户指定，无默认值

    if not model:
        raise Exception("未配置模型名称，请在设置中填写")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{api_url}/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": ("audio.webm", audio_bytes, "audio/webm")},
            data={"model": model, "language": "zh"},
        )
        if response.status_code == 200:
            return response.json().get("text", "")
        else:
            raise Exception(f"ASR API 错误: {response.text}")


async def call_nlp(text: str, config) -> dict:
    """调用 NLP API（Chat Completions）"""
    from datetime import datetime
    prompt = NLP_SYSTEM_PROMPT.format(current_time=datetime.now().isoformat())

    api_url = (config.api_url or "https://api.openai.com/v1").rstrip("/")
    api_key = config.api_key
    model = config.model_name  # 必须由用户指定

    if not model:
        raise Exception("未配置模型名称，请在设置中填写")

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{api_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text},
                ],
                "temperature": 0.1,
            },
        )
        if response.status_code != 200:
            raise Exception(f"NLP API 错误 (HTTP {response.status_code}): {response.text[:200]}")

        # 安全地解析响应，兼容各种返回格式
        try:
            resp_json = response.json()
        except Exception as e:
            raise Exception(f"NLP 响应不是有效 JSON: {str(e)}")

        logger.info(f"[NLP] 原始响应: {str(resp_json)[:500]}")

        # 兼容多种响应结构
        content = None
        try:
            # 标准 OpenAI 格式: choices[0].message.content
            if isinstance(resp_json, dict):
                choices = resp_json.get("choices")
                if isinstance(choices, list) and len(choices) > 0:
                    message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
                    content = message.get("content")
                # 某些 API 可能直接返回 content
                if content is None:
                    content = resp_json.get("content") or resp_json.get("output") or resp_json.get("result")
        except Exception:
            content = None

        if content is None:
            raise Exception(f"NLP 响应结构异常，无法提取 content: {str(resp_json)[:200]}")

        # content 可能是字符串、dict 或 list
        if isinstance(content, dict):
            logger.info(f"[NLP] content 是 dict，直接使用: {str(content)[:200]}")
            return content

        if isinstance(content, list):
            if content and isinstance(content[0], dict):
                content = content[0].get("text") or str(content[0])
            else:
                content = str(content)

        if not isinstance(content, str):
            content = str(content)

        # 清理 markdown 代码块标记
        content = content.strip()
        logger.info(f"[NLP] 清理前 content: {content[:300]}")

        if content.startswith("```"):
            lines = content.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            content = "\n".join(lines).strip()

        # 尝试解析 JSON
        try:
            result = json.loads(content)
            if isinstance(result, dict):
                logger.info(f"[NLP] 解析成功: intent={result.get('intent')}")
                return result
            return {"intent": "unknown", "description": f"NLP 返回非对象: {str(result)[:100]}"}
        except json.JSONDecodeError:
            import re
            match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group())
                    if isinstance(result, dict):
                        logger.info(f"[NLP] 正则解析成功: intent={result.get('intent')}")
                        return result
                except json.JSONDecodeError:
                    pass
            logger.warning(f"[NLP] JSON 解析失败，原始内容: {content[:200]}")
            return {"intent": "unknown", "description": f"NLP 返回内容无法解析: {content[:100]}"}

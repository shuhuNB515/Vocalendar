from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import json
import base64

from ..database import get_db
from ..schemas import VoiceProcessRequest, VoiceProcessResponse, ExtractedInfo, VoiceResult
from ..routers.auth import verify_token
from ..routers.schedules import get_user_id

router = APIRouter()

# NLP Prompt 模板
NLP_SYSTEM_PROMPT = """你是「言程」智能日程助手的 NLP 解析模块。用户会通过语音输入一段自然语言，你需要从中提取日程相关信息。

请分析用户的意图，并提取以下信息：
- intent: 意图类型，取值为 create（创建日程）、query（查询日程）、modify（修改日程）、delete（删除日程）、unknown（无法识别）
- title: 事件标题
- datetime: 时间（ISO 8601 格式，如 2026-06-17T15:00:00）
- location: 地点
- description: 描述
- confirm_required: 是否需要用户确认（创建和修改时为 true）

请以 JSON 格式返回结果。示例：
用户："帮我记一下，明天下午三点在星巴克和李总谈合同"
返回：{"intent": "create", "title": "和李总谈合同", "datetime": "2026-06-17T15:00:00", "location": "星巴克", "description": null, "confirm_required": true}

用户："我今天下午有什么安排？"
返回：{"intent": "query", "title": null, "datetime": "2026-06-16T12:00:00", "location": null, "description": null, "confirm_required": false}

用户："把刚才那个会议推迟半小时"
返回：{"intent": "modify", "title": null, "datetime": null, "location": null, "description": "推迟30分钟", "confirm_required": true}

用户："取消明天上午的所有日程"
返回：{"intent": "delete", "title": null, "datetime": "2026-06-17T09:00:00", "location": null, "description": "删除上午所有日程", "confirm_required": true}

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
        # 1. ASR: 语音识别（如果有 ASR API Key）
        if req.api_keys.asr_api_key and req.audio_base64:
            transcript = await call_asr(req.audio_base64, req.api_keys.asr_api_key)
        else:
            # 没有配置 ASR，使用模拟文本
            transcript = "（语音识别未配置，请先在设置中配置 ASR API Key）"

        # 2. NLP: 意图解析（如果有 NLP API Key）
        if req.api_keys.nlp_api_key and transcript:
            nlp_result = await call_nlp(transcript, req.api_keys.nlp_api_key)
            intent = nlp_result.get("intent", "unknown")
            extracted = ExtractedInfo(
                title=nlp_result.get("title"),
                datetime=nlp_result.get("datetime"),
                location=nlp_result.get("location"),
                description=nlp_result.get("description"),
            )
            confirm_required = nlp_result.get("confirm_required", False)
        else:
            # 没有配置 NLP，返回原始文本
            intent = "unknown"

        # 3. 根据意图执行操作
        if intent == "query":
            from ..models import Schedule
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

            from ..schemas import ScheduleOut
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
        intent = "unknown"
        extracted = ExtractedInfo(description=f"处理出错: {str(e)}")

    return VoiceProcessResponse(
        transcript=transcript,
        intent=intent,
        extracted=extracted,
        result=result,
        confirm_required=confirm_required,
    )


async def call_asr(audio_base64: str, api_key: str) -> str:
    """调用 ASR API（OpenAI Whisper）"""
    audio_bytes = base64.b64decode(audio_base64)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": ("audio.webm", audio_bytes, "audio/webm")},
            data={"model": "whisper-1", "language": "zh"},
        )
        if response.status_code == 200:
            return response.json().get("text", "")
        else:
            raise Exception(f"ASR API 错误: {response.text}")


async def call_nlp(text: str, api_key: str) -> dict:
    """调用 NLP API（OpenAI GPT）"""
    from datetime import datetime
    prompt = NLP_SYSTEM_PROMPT.format(current_time=datetime.now().isoformat())

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text},
                ],
                "temperature": 0.1,
            },
        )
        if response.status_code == 200:
            content = response.json()["choices"][0]["message"]["content"]
            # 尝试解析 JSON
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # 尝试从内容中提取 JSON
                import re
                match = re.search(r'\{.*\}', content, re.DOTALL)
                if match:
                    return json.loads(match.group())
                return {"intent": "unknown"}
        else:
            raise Exception(f"NLP API 错误: {response.text}")

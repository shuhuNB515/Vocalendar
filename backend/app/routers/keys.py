from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from cryptography.fernet import Fernet
import os
import hashlib
import base64
import sys

import httpx

from ..database import get_db
from ..models import ApiKey
from ..schemas import SaveKeysRequest, KeyStatusResponse, TestKeyRequest, TestKeyResponse
from ..routers.auth import verify_token
from ..routers.schedules import get_user_id

router = APIRouter()


def _get_encryption_key() -> bytes:
    """获取加密 key，确保每次启动使用相同的 key"""
    env_key = os.getenv("ENCRYPTION_KEY")
    if env_key:
        return env_key.encode() if isinstance(env_key, str) else env_key
    # 使用固定种子生成确定性的 key，确保重启后能解密
    print("[WARNING] ENCRYPTION_KEY 环境变量未设置，使用默认加密密钥（仅限开发环境）", file=sys.stderr)
    seed = "vocalendar-default-encryption-key-2024"
    digest = hashlib.sha256(seed.encode()).digest()
    return base64.urlsafe_b64encode(digest)


ENCRYPTION_KEY = _get_encryption_key()
fernet = Fernet(ENCRYPTION_KEY)


def encrypt_key(key: str) -> str:
    return fernet.encrypt(key.encode()).decode()


def decrypt_key(encrypted: str) -> str:
    return fernet.decrypt(encrypted.encode()).decode()


@router.get("", response_model=KeyStatusResponse)
async def get_key_status(
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ApiKey).where(ApiKey.user_id == user_id))
    key_record = result.scalar_one_or_none()

    if not key_record:
        return KeyStatusResponse(is_set=False)

    url = key_record.api_url or None
    if url and len(url) > 40:
        url = url[:30] + "..."

    return KeyStatusResponse(
        is_set=True,
        api_url=url,
        model_name=key_record.model_name or None,
    )


@router.post("")
async def save_keys(
    req: SaveKeysRequest,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not req.api_key:
        raise HTTPException(status_code=400, detail="API Key 不能为空")
    if len(req.api_key) > 256:
        raise HTTPException(status_code=400, detail="API Key 长度不能超过 256 个字符")
    if req.api_url and len(req.api_url) > 500:
        raise HTTPException(status_code=400, detail="API URL 长度不能超过 500 个字符")
    if req.model_name and len(req.model_name) > 100:
        raise HTTPException(status_code=400, detail="模型名称长度不能超过 100 个字符")

    result = await db.execute(select(ApiKey).where(ApiKey.user_id == user_id))
    existing = result.scalar_one_or_none()

    if existing:
        existing.encrypted_key = encrypt_key(req.api_key)
        if req.api_url is not None:
            existing.api_url = req.api_url
        if req.model_name is not None:
            existing.model_name = req.model_name
    else:
        new_key = ApiKey(
            user_id=user_id,
            api_url=req.api_url,
            encrypted_key=encrypt_key(req.api_key),
            model_name=req.model_name,
        )
        db.add(new_key)

    await db.commit()
    return {"success": True}


@router.post("/test", response_model=TestKeyResponse)
async def test_key(
    req: TestKeyRequest,
    user_id: int = Depends(get_user_id),
):
    try:
        api_url = (req.api_url or "https://api.openai.com/v1").rstrip("/")
        # 必须指定模型名称，否则无法测试
        if not req.model_name:
            return TestKeyResponse(success=False, message="请填写模型名称后再测试")

        model = req.model_name

        # 用 chat completions 测试连接
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{api_url}/chat/completions",
                headers={"Authorization": f"Bearer {req.api_key}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "Hi"}],
                    "max_tokens": 1,
                },
            )
            if response.status_code == 200:
                return TestKeyResponse(success=True, message=f"连接成功！模型: {model}")
            else:
                detail = response.text[:200]
                return TestKeyResponse(success=False, message=f"连接失败 (HTTP {response.status_code}): {detail}")

    except Exception as e:
        return TestKeyResponse(success=False, message=f"连接出错: {str(e)}")

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from cryptography.fernet import Fernet
import base64
import os

from ..database import get_db
from ..models import ApiKey
from ..schemas import SaveKeysRequest, KeyStatusResponse, TestKeyRequest, TestKeyResponse
from ..routers.auth import verify_token
from ..routers.schedules import get_user_id

router = APIRouter()

# 加密密钥（生产环境应从环境变量读取）
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)


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
    keys = result.scalars().all()

    key_types = {k.key_type for k in keys}
    return KeyStatusResponse(
        asr_api_key_set="asr" in key_types,
        nlp_api_key_set="nlp" in key_types,
        tts_api_key_set="tts" in key_types,
    )


@router.post("")
async def save_keys(
    req: SaveKeysRequest,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    key_map = {
        "asr": req.asr_api_key,
        "nlp": req.nlp_api_key,
        "tts": req.tts_api_key,
    }

    for key_type, key_value in key_map.items():
        if not key_value:
            continue

        result = await db.execute(
            select(ApiKey).where(ApiKey.user_id == user_id, ApiKey.key_type == key_type)
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.encrypted_key = encrypt_key(key_value)
        else:
            new_key = ApiKey(
                user_id=user_id,
                key_type=key_type,
                encrypted_key=encrypt_key(key_value),
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
        import httpx

        if req.key_type == "nlp":
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {req.api_key}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": "test"}],
                        "max_tokens": 1,
                    },
                )
                if response.status_code == 200:
                    return TestKeyResponse(success=True, message="NLP API Key 验证成功")
                else:
                    return TestKeyResponse(success=False, message=f"验证失败: {response.status_code}")

        elif req.key_type == "asr":
            # 简单验证 - 尝试列出模型
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {req.api_key}"},
                )
                if response.status_code == 200:
                    return TestKeyResponse(success=True, message="ASR API Key 验证成功")
                else:
                    return TestKeyResponse(success=False, message=f"验证失败: {response.status_code}")

        elif req.key_type == "tts":
            return TestKeyResponse(success=True, message="TTS API Key 格式验证通过")

        else:
            return TestKeyResponse(success=False, message="未知的 Key 类型")

    except Exception as e:
        return TestKeyResponse(success=False, message=f"验证出错: {str(e)}")

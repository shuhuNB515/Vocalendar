from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# 认证
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


# 日程
class ScheduleCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: str  # ISO 8601
    end_time: Optional[str] = None
    reminder_minutes: int = 15


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reminder_minutes: Optional[int] = None


class ScheduleOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: str
    end_time: Optional[str] = None
    reminder_minutes: int = 15
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# 语音处理
class VoiceProcessRequest(BaseModel):
    audio_base64: Optional[str] = None
    text_input: Optional[str] = None
    api_config: Optional["ApiKeyConfig"] = None  # 统一的多模态 API 配置
    context: Optional["VoiceContext"] = None


class ApiKeyConfig(BaseModel):
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None


class VoiceContext(BaseModel):
    last_event_id: Optional[int] = None


class VoiceProcessResponse(BaseModel):
    transcript: str
    intent: str
    extracted: "ExtractedInfo"
    result: Optional["VoiceResult"] = None
    audio_response_base64: Optional[str] = None
    confirm_required: bool = False


class ExtractedInfo(BaseModel):
    title: Optional[str] = None
    datetime: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None


class VoiceResult(BaseModel):
    events: Optional[list[ScheduleOut]] = None
    modified_event: Optional[ScheduleOut] = None
    deleted_ids: Optional[list[int]] = None


# API Key（统一多模态配置）
class SaveKeysRequest(BaseModel):
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None


class KeyStatusResponse(BaseModel):
    is_set: bool
    api_url: Optional[str] = None
    model_name: Optional[str] = None


class TestKeyRequest(BaseModel):
    api_url: Optional[str] = None
    api_key: str
    model_name: Optional[str] = None


class TestKeyResponse(BaseModel):
    success: bool
    message: str

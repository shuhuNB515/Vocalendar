from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os

from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, RegisterRequest, AuthResponse, UserOut

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "vocalendar-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小时


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(status_code=401, detail="无效的认证凭据")
        return int(user_id_str)
    except JWTError:
        raise HTTPException(status_code=401, detail="无效的认证凭据")


async def get_current_user_id(token: str = None) -> int:
    """从请求头获取当前用户 ID"""
    if not token:
        raise HTTPException(status_code=401, detail="未提供认证凭据")
    return verify_token(token)


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # 检查邮箱是否已存在
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    # 创建用户
    password_hash = bcrypt.hashpw(req.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    user = User(email=req.email, password_hash=password_hash)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 生成 token
    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(token=token, user=UserOut(id=user.id, email=user.email))


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # 查找用户
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not bcrypt.checkpw(req.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")

    # 生成 token
    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(token=token, user=UserOut(id=user.id, email=user.email))

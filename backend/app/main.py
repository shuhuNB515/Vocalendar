from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, schedules, voice, keys
from .database import engine, Base

app = FastAPI(
    title="言程 Vocalendar API",
    description="智能语音日程管家后端 API",
    version="0.1.0",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["日程"])
app.include_router(voice.router, prefix="/api/voice", tags=["语音"])
app.include_router(keys.router, prefix="/api/keys", tags=["密钥"])


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "Vocalendar API"}

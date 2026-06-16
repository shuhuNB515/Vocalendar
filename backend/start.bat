@echo off
chcp 65001 >nul
echo ========================================
echo   言程 Vocalendar 后端启动（稳定模式）
echo ========================================
echo.
cd /d "%~dp0"
echo 正在启动后端服务（端口 8000，无 --reload）...
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause

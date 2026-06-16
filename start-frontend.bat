@echo off
chcp 65001 >nul
echo ========================================
echo   言程 Vocalendar 前端启动
echo ========================================
echo.
cd /d "%~dp0"
echo 正在启动前端服务（端口 5173）...
echo.
npm run dev
pause

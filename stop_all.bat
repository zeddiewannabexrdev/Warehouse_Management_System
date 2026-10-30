@echo off
chcp 65001 >nul
title Dừng Hệ Thống Distributed WMS
cls

echo ===============================================================================
echo                DỪNG HỆ THỐNG DISTRIBUTED WMS (PORTS 5000 & 3000)
echo ===============================================================================
echo.

echo Đang giải phóng Port 5000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
    echo   - Đã dừng tiến trình Backend (PID %%a)
)

echo Đang giải phóng Port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
    echo   - Đã dừng tiến trình Frontend (PID %%a)
)

echo.
echo ✔ Đã dừng toàn bộ dịch vụ Web thành công!
pause

@echo off
setlocal
chcp 65001 >nul
title KHOI DONG DISTRIBUTED WMS SYSTEM
cls

echo ===============================================================================
echo        HE THONG QUAN TRI VA DIEU PHOI VAT TU DOANH NGHIEP PHAN TAN (WMS)
echo                       MONGODB SHARDED CLUSTER ARCHITECTURE
echo ===============================================================================
echo.

set CURRENT_DIR=%~dp0

echo [1/3] Dang khoi dong Backend API Gateway (Port 5000)...
start "Distributed WMS - Backend Gateway" /D "%CURRENT_DIR%backend" cmd /k "title Backend Gateway (Port 5000) && call npm run start:dev"

echo     - Cho Backend khoi dong va ket noi MongoDB...
ping 127.0.0.1 -n 5 >nul

echo.
echo [2/3] Dang khoi dong Frontend Web Application (Port 3000)...
start "Distributed WMS - Frontend Web" /D "%CURRENT_DIR%frontend" cmd /k "title Frontend Web (Port 3000) && call npm run dev"

echo     - Cho Vite Dev Server san sang...
ping 127.0.0.1 -n 3 >nul

echo.
echo [3/3] Dang mo trinh duyet Web tai http://localhost:3000 ...
start "" "http://localhost:3000"

echo.
echo ===============================================================================
echo                       HE THONG DA KHOI DONG THANH CONG!
echo ===============================================================================
echo.
echo   * Giao dien Web (Frontend)   : http://localhost:3000
echo   * Backend RESTful API Base   : http://localhost:5000/api/v1
echo   * Swagger OpenAPI API Docs   : http://localhost:5000/docs
echo   * Health Check Database      : http://localhost:5000/api/v1/health/database
echo.
echo -------------------------------------------------------------------------------
echo   TAI KHOAN DEMO DANG NHAP (RBAC MULTI-BRANCH):
echo   1. Super Admin   : admin@wms.enterprise.vn       / Admin@Distributed2026
echo   2. Quan kho HN   : manager.hn@wms.enterprise.vn  / Wms@123456 (ZONE_HN)
echo   3. Quan kho HCM  : manager.hcm@wms.enterprise.vn / Wms@123456 (ZONE_HCM)
echo   4. Truong KCS/QC : qc.lead@wms.enterprise.vn     / Wms@123456
echo   5. Kiem toan vien: auditor@wms.enterprise.vn     / Wms@123456
echo -------------------------------------------------------------------------------
echo.
echo (Ban co the thu nho cua so nay, Backend va Frontend dang chay tren 2 cua so rieng biet)
echo Nhan phim bat ky de thoat khoi man hinh nay...
pause >nul

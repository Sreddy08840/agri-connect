@echo off
REM Pre-flight Check Script
REM Verifies all requirements before starting services

echo ========================================
echo 🔍 Pre-flight System Check
echo ========================================
echo.

set ERRORS=0

REM Check Node.js
echo [1/8] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo    Download from: https://nodejs.org/
    set ERRORS=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js %NODE_VERSION% installed
)
echo.

REM Check pnpm
echo [2/8] Checking pnpm...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pnpm is not installed
    echo    Install with: npm install -g pnpm
    set ERRORS=1
) else (
    for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
    echo ✓ pnpm %PNPM_VERSION% installed
)
echo.

REM Check Python
echo [3/8] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed
    echo    Download from: https://www.python.org/
    set ERRORS=1
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo ✓ %PYTHON_VERSION% installed
)
echo.

REM Check pip
echo [4/8] Checking pip...
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pip is not installed
    set ERRORS=1
) else (
    echo ✓ pip installed
)
echo.

REM Check Docker
echo [5/8] Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed
    echo    Download from: https://www.docker.com/products/docker-desktop
    set ERRORS=1
) else (
    for /f "tokens=*" %%i in ('docker --version') do set DOCKER_VERSION=%%i
    echo ✓ %DOCKER_VERSION% installed
)
echo.

REM Check Docker Compose
echo [6/8] Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed
    set ERRORS=1
) else (
    for /f "tokens=*" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
    echo ✓ %COMPOSE_VERSION% installed
)
echo.

REM Check if ports are available
echo [7/8] Checking port availability...
netstat -an | findstr ":8000" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 8000 is already in use (ML Service)
) else (
    echo ✓ Port 8000 is available
)

netstat -an | findstr ":8080" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 8080 is already in use (Backend API)
) else (
    echo ✓ Port 8080 is available
)

netstat -an | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 5173 is already in use (Web App)
) else (
    echo ✓ Port 5173 is available
)

netstat -an | findstr ":6380" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠ Port 6380 is already in use (Redis)
) else (
    echo ✓ Port 6380 is available
)
echo.

REM Check project structure
echo [8/8] Checking project structure...
if not exist "packages\api\" (
    echo ❌ packages/api directory not found
    set ERRORS=1
) else (
    echo ✓ packages/api found
)

if not exist "packages\ml\" (
    echo ❌ packages/ml directory not found
    set ERRORS=1
) else (
    echo ✓ packages/ml found
)

if not exist "apps\web\" (
    echo ❌ apps/web directory not found
    set ERRORS=1
) else (
    echo ✓ apps/web found
)

if not exist "apps\mobile\" (
    echo ❌ apps/mobile directory not found
    set ERRORS=1
) else (
    echo ✓ apps/mobile found
)
echo.

REM Check configuration files
echo Checking configuration files...
if not exist "packages\api\.env" (
    if exist "packages\api\.env.example" (
        echo ⚠ packages/api/.env not found (will be created from .env.example)
    ) else (
        echo ❌ packages/api/.env.example not found
        set ERRORS=1
    )
) else (
    echo ✓ packages/api/.env exists
)

if not exist "apps\web\.env" (
    if exist "apps\web\.env.example" (
        echo ⚠ apps/web/.env not found (will be created from .env.example)
    ) else (
        echo ❌ apps/web/.env.example not found
        set ERRORS=1
    )
) else (
    echo ✓ apps/web/.env exists
)

if not exist "packages\ml\.env" (
    if exist "packages\ml\.env.example" (
        echo ⚠ packages/ml/.env not found (will be created from .env.example)
    ) else (
        echo ❌ packages/ml/.env.example not found
        set ERRORS=1
    )
) else (
    echo ✓ packages/ml/.env exists
)
echo.

REM Summary
echo ========================================
if %ERRORS% equ 0 (
    echo ✅ All checks passed!
    echo.
    echo You can now start the services:
    echo    start-all-services.bat
) else (
    echo ❌ Some checks failed!
    echo.
    echo Please fix the issues above before starting services.
)
echo ========================================
echo.
pause

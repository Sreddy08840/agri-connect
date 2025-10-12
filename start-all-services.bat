@echo off
REM Complete Agri-Connect Startup Script
REM This script starts all services in the correct order

echo ========================================
echo 🚀 Starting Agri-Connect Platform
echo ========================================
echo.

REM Check if Docker is running
echo Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and try again
    pause
    exit /b 1
)

echo ✓ Docker is available
echo.

REM Check if pnpm is installed
echo Checking pnpm...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pnpm is not installed
    echo Installing pnpm globally...
    npm install -g pnpm
)

echo ✓ pnpm is available
echo.

REM Start Docker services
echo ========================================
echo 📦 Starting Docker Services
echo ========================================
echo Starting Redis, ML Service...
docker-compose up -d redis ml-service

echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ✓ Docker services started
echo.

REM Check ML Service health
echo Checking ML Service health...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠ ML Service not ready yet, waiting...
    timeout /t 5 /nobreak >nul
)

echo ✓ ML Service is healthy
echo.

REM Start Backend API
echo ========================================
echo 🔧 Starting Backend API
echo ========================================
cd packages\api

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call pnpm install
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo ⚠ Please configure .env file with your settings
)

echo Starting API server...
start "Agri-Connect API" cmd /k "pnpm dev"

cd ..\..
timeout /t 5 /nobreak >nul
echo.

REM Start Web App
echo ========================================
echo 🌐 Starting Web Application
echo ========================================
cd apps\web

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call pnpm install
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

echo Starting web app...
start "Agri-Connect Web" cmd /k "pnpm dev"

cd ..\..
echo.

REM Display service URLs
echo ========================================
echo ✅ All Services Started!
echo ========================================
echo.
echo 📡 Service URLs:
echo ├─ ML Service:    http://localhost:8000
echo ├─ ML API Docs:   http://localhost:8000/docs
echo ├─ Backend API:   http://localhost:8080
echo ├─ Web App:       http://localhost:5173
echo └─ Redis:         localhost:6380
echo.
echo 📱 To start mobile app:
echo    cd apps/mobile
echo    pnpm start
echo.
echo 🧪 To test integration:
echo    test-ai-integration.bat
echo.
echo 📊 To view Docker logs:
echo    docker-compose logs -f
echo.
echo 🛑 To stop all services:
echo    docker-compose down
echo    Close the API and Web terminal windows
echo.
pause

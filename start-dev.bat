@echo off
echo Starting Agri-Connect Development Environment...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    pnpm install
    echo.
)

REM Copy environment files if they don't exist
if not exist "packages\api\.env" (
    echo Setting up API environment...
    copy "packages\api\.env.example" "packages\api\.env"
)

if not exist "apps\web\.env" (
    echo Setting up Web environment...
    copy "apps\web\.env.example" "apps\web\.env"
)

REM Generate Prisma client and setup database
echo Setting up database...
cd packages\api
pnpm prisma generate
pnpm prisma db push
pnpm db:seed
cd ..\..

echo.
echo Starting all services...
echo - API Server: http://localhost:3001
echo - Web App: http://localhost:5173
echo - Mobile App: Expo DevTools will open
echo.

REM Start all services in parallel
start "API Server" cmd /k "cd packages\api && set PORT=3001 && set NODE_ENV=development && set OTP_PROVIDER=mock && pnpm dev"
timeout /t 3 /nobreak >nul
start "Web App" cmd /k "cd apps\web && set VITE_API_URL=http://localhost:3001/api && set VITE_SOCKET_URL=http://localhost:3001 && pnpm dev"
timeout /t 2 /nobreak >nul
start "Mobile App" cmd /k "cd apps\mobile && pnpm start"

echo All services started! Check the opened terminal windows.
pause

@echo off
REM Common Issues Fix Script
REM Automatically fixes common setup issues

echo ========================================
echo 🔧 Fixing Common Issues
echo ========================================
echo.

REM Create .env files if missing
echo [1/5] Checking environment files...

if not exist "packages\api\.env" (
    if exist "packages\api\.env.example" (
        echo Creating packages/api/.env...
        copy "packages\api\.env.example" "packages\api\.env"
        echo ✓ Created packages/api/.env
    )
) else (
    echo ✓ packages/api/.env exists
)

if not exist "apps\web\.env" (
    if exist "apps\web\.env.example" (
        echo Creating apps/web/.env...
        copy "apps\web\.env.example" "apps\web\.env"
        echo ✓ Created apps/web/.env
    )
) else (
    echo ✓ apps/web/.env exists
)

if not exist "packages\ml\.env" (
    if exist "packages\ml\.env.example" (
        echo Creating packages/ml/.env...
        copy "packages\ml\.env.example" "packages\ml\.env"
        echo ✓ Created packages/ml/.env
    )
) else (
    echo ✓ packages/ml/.env exists
)
echo.

REM Install dependencies
echo [2/5] Installing dependencies...

echo Installing root dependencies...
call pnpm install
echo.

echo Installing API dependencies...
cd packages\api
call pnpm install
cd ..\..
echo.

echo Installing Web dependencies...
cd apps\web
call pnpm install
cd ..\..
echo.

echo Installing Mobile dependencies...
cd apps\mobile
call pnpm install
cd ..\..
echo.

echo Installing ML dependencies...
cd packages\ml
pip install -r requirements.txt
cd ..\..
echo.

REM Generate Prisma client
echo [3/5] Generating Prisma client...
cd packages\api
call pnpm prisma generate
cd ..\..
echo ✓ Prisma client generated
echo.

REM Create necessary directories
echo [4/5] Creating necessary directories...

if not exist "packages\ml\models\" (
    mkdir "packages\ml\models"
    echo ✓ Created packages/ml/models
)

if not exist "packages\ml\vectors\" (
    mkdir "packages\ml\vectors"
    echo ✓ Created packages/ml/vectors
)

if not exist "packages\api\uploads\" (
    mkdir "packages\api\uploads"
    echo ✓ Created packages/api/uploads
)
echo.

REM Clean Docker containers
echo [5/5] Cleaning Docker containers...
docker-compose down
echo ✓ Docker containers stopped
echo.

echo ========================================
echo ✅ Common issues fixed!
echo ========================================
echo.
echo Next steps:
echo 1. Review .env files and update with your settings
echo 2. Run: pre-flight-check.bat
echo 3. Run: start-all-services.bat
echo.
pause

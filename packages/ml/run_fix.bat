@echo off
echo ============================================================
echo ML SERVICE - ONE-COMMAND FIX
echo ============================================================
echo.
echo This will fix all errors and start the service.
echo.
pause

echo.
echo Step 1: Running quick fix...
echo ============================================================
.\venv\Scripts\python.exe quick_fix.py

echo.
echo.
echo Step 2: Starting ML service...
echo ============================================================
echo.
echo The service will start now. Press CTRL+C to stop it.
echo.
echo Once started, open: http://127.0.0.1:8000/docs
echo.
pause

py -m app.main

# Start ML Service Script for Windows

Write-Host "Starting ML Service..." -ForegroundColor Green

# Check if virtual environment exists
if (!(Test-Path "venv")) {
    Write-Host "Error: Virtual environment not found. Run setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Activate virtual environment
& .\venv\Scripts\Activate.ps1

# Start uvicorn
Write-Host "Starting uvicorn server..." -ForegroundColor Yellow
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

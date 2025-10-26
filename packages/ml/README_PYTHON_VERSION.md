# Python Version Requirement

## Issue
The ML package requires Python 3.13 or earlier. Python 3.14 is not yet supported by pydantic-core.

## Solution

### Option 1: Install Python 3.13 (Recommended)
1. Download Python 3.13 from https://www.python.org/downloads/
2. Install it to a separate directory (e.g., `C:\Python313\`)
3. Create a virtual environment with Python 3.13:
   ```powershell
   cd c:\Users\sredd\Desktop\agri-connect1\packages\ml
   C:\Python313\python.exe -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

### Option 2: Use pyenv-win
1. Install pyenv-win: https://github.com/pyenv-win/pyenv-win
2. Install Python 3.13:
   ```powershell
   pyenv install 3.13.0
   pyenv local 3.13.0
   ```
3. Create venv and install:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

### Option 3: Temporary Workaround (Not Recommended)
Set environment variable to force compatibility:
```powershell
$env:PYO3_USE_ABI3_FORWARD_COMPATIBILITY="1"
pip install -r requirements.txt
```
⚠️ This may cause runtime issues.

## Running the ML Service
After installing dependencies:
```powershell
.\venv\Scripts\Activate.ps1
python main.py
```
or
```powershell
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

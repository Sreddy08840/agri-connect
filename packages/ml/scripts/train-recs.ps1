# PowerShell helper to run recommendation training without GNU make
# Usage: .\scripts\train-recs.ps1

Set-Location -Path "$PSScriptRoot\.."
# Run using the Python launcher which is available on most Windows installs
py -m training.train_recs

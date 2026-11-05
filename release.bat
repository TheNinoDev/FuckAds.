@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\release.ps1"
if errorlevel 1 echo Release failed.
pause

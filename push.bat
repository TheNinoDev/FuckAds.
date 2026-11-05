@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\push.ps1"
if errorlevel 1 echo Push failed.
pause

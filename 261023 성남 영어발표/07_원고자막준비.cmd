@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0app\start.ps1" -View script
if errorlevel 1 pause

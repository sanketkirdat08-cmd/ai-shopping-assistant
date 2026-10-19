@echo off
title Nexa AI Shopping Assistant
echo ===================================================
echo   Starting Nexa AI Shopping Assistant...
echo   Web browser will open automatically!
echo ===================================================
cd /d "%~dp0"
call npm run dev
pause


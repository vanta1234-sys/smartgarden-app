@echo off
chcp 65001 >nul
title SmartGarden Auto Deploy
color 0A

cd /d "%~dp0"

echo ======================================================================
echo    SMARTGARDEN.GR - AUTO DEPLOY PIPELINE
echo ======================================================================
echo.

echo [1/3] Copying latest_articles.json from Downloads...
powershell.exe -NoProfile -NonInteractive -Command "Get-ChildItem -Path '%USERPROFILE%\Downloads\latest_articles*.json' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination 'public\latest_articles.json' -Force; Write-Host '>>> Updated: public\latest_articles.json' }"

echo.
echo [2/3] Building (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Build failed! Check errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Uploading to smartgarden.gr via Node.js...
node ftp_upload.js

echo.
echo ======================================================================
echo   DONE! Site updated: https://smartgarden.gr
echo ======================================================================
pause
@echo off
setlocal

set "ROOT=%~dp0"
set "APP_DIR=%ROOT%khuthon\Khuthon"
set "FRONTEND_DIR=%APP_DIR%\frontend"

if not exist "%FRONTEND_DIR%\package.json" (
  echo Frontend package.json not found:
  echo %FRONTEND_DIR%\package.json
  pause
  exit /b 1
)

cd /d "%FRONTEND_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 8085 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Write-Host 'Stopping existing Expo process on port 8085...'; Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 2"

if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo Frontend dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting Expo Web.
echo Open http://localhost:8085 in your browser.
npx expo start --web --clear --port 8085

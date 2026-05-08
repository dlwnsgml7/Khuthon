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

if not exist "node_modules" (
  echo Installing frontend dependencies...
  call npm install
  if errorlevel 1 (
    echo Frontend dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting Expo for mobile. Scan the QR code with Expo Go.
echo Keep this window open while testing.
npx expo start --clear --port 8085

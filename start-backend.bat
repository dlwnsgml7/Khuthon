@echo off
setlocal

set "ROOT=%~dp0"
set "APP_DIR=%ROOT%khuthon\Khuthon"
set "BACKEND_DIR=%APP_DIR%\backend"

if not exist "%BACKEND_DIR%\package.json" (
  echo Backend package.json not found:
  echo %BACKEND_DIR%\package.json
  pause
  exit /b 1
)

cd /d "%BACKEND_DIR%"

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
  )
)

if not exist "node_modules" (
  echo Installing backend dependencies...
  call npm install
  if errorlevel 1 (
    echo Backend dependency installation failed.
    pause
    exit /b 1
  )
)

echo Starting LocalCourse backend on http://localhost:4000
node src\index.js


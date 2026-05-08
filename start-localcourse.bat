@echo off
setlocal

set "ROOT=%~dp0"

echo Starting LocalCourse backend in a new window...
start "LocalCourse Backend" cmd /k ""%ROOT%start-backend.bat""

echo Starting LocalCourse web frontend in a new window...
start "LocalCourse Web" cmd /k ""%ROOT%start-web.bat""

echo.
echo LocalCourse is starting.
echo Backend: http://localhost:4000
echo Frontend: http://localhost:8085
echo.
echo Demo login:
echo   demo@local.com
echo   test1234
echo.
pause

@echo off
TITLE KMCT Campus Connect Launcher
color 0B

echo ===================================================
echo    KMCT Campus Connect - Setup ^& Run Utility
echo ===================================================
echo.

echo [1/4] Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b
)
echo Node.js is installed.

echo.
echo [2/4] Installing dependencies (this may take a few minutes)...
call npm install --no-fund --no-audit

echo.
echo [3/4] Building production UI...
call npm run build

echo.
echo [4/4] Starting servers with PM2...
call npx pm2 -v >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing PM2 process manager...
    call npm install -g pm2
)

:: Restart any existing instances to apply new changes
call npx pm2 stop all >nul 2>nul
call npx pm2 start ecosystem.config.cjs

echo.
echo ===================================================
echo  SUCCESS! Application is now running in background.
echo ===================================================
echo.
echo  The system is being served via the Node API at:
echo  http://localhost:5000
echo.
echo  To view live logs, run: npx pm2 logs
echo  To stop the app, run:   npx pm2 stop all
echo ===================================================
echo.
echo Opening application in your default browser...
timeout /t 3 /nobreak >nul
start http://localhost:5000
pause

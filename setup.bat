@echo off
REM Homebox MCP Server Setup Script for Windows
REM This script helps you set up the Homebox MCP server

echo =======================================
echo Homebox MCP Server Setup
echo =======================================
echo.

REM Check if Node.js is installed
echo Checking for Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Download the LTS version and run the installer.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%
echo.

REM Check if npm is installed
echo Checking for npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] npm is not installed!
    echo npm usually comes with Node.js. Please reinstall Node.js.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed successfully
echo.

REM Check if config.json exists
if not exist "config.json" (
    echo Creating config.json from template...
    copy config.json.example config.json
    echo [OK] config.json created
    echo.
    echo [!] IMPORTANT: Please edit config.json and add your Homebox details:
    echo    - homeboxUrl: The URL where your Homebox is running
    echo    - email: Your Homebox login email
    echo    - password: Your Homebox login password
    echo.
    echo You can edit it with Notepad or any text editor:
    echo    notepad config.json
    echo.
    pause
) else (
    echo [OK] config.json already exists
    echo.
)

REM Build the server
echo Building the server...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [X] Failed to build the server
    pause
    exit /b 1
)

echo [OK] Server built successfully
echo.

echo =======================================
echo Setup Complete!
echo =======================================
echo.
echo Next steps:
echo 1. Make sure your Homebox instance is running
echo 2. Test the server with: npm start
echo 3. Configure Claude Desktop (see README.md)
echo.
echo For detailed instructions, see README.md
echo.
pause

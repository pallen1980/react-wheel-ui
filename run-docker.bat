@echo off

echo Starting The Wheel Application with Docker Compose
echo ====================================================

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Check if files exist
if not exist "docker-compose.yml" (
    echo ERROR: docker-compose.yml not found
    pause
    exit /b 1
)

if not exist ".env" (
    echo ERROR: .env file not found
    pause
    exit /b 1
)

echo Docker is ready
echo Configuration files found
echo.

REM Simple menu
echo Choose run mode:
echo 1. Start normally (see logs)
echo 2. Start in background
echo 3. Rebuild and start
echo.
set /p choice=Enter choice (1-3): 

if "%choice%"=="2" goto detached
if "%choice%"=="3" goto rebuild
goto normal

:normal
echo Starting containers...
docker-compose up
goto end

:detached
echo Starting containers in background...
docker-compose up -d
echo.
echo Application started! Access at: http://localhost:51235
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
goto end

:rebuild
echo Rebuilding and starting containers...
docker-compose up --build
goto end

:end
pause
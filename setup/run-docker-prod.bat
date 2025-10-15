@echo off

echo Starting The Wheel Application in PRODUCTION MODE
echo Connecting to production API at http://localhost:8080
echo =================================================

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Check if files exist
if not exist "docker-compose.prod.yml" (
    echo ERROR: docker-compose.prod.yml not found
    pause
    exit /b 1
)

REM Check for production environment file
if exist ".env.production" (
    echo Using production environment file: .env.production
) else (
    echo Using default environment file: .env
    echo WARNING: Consider creating .env.production for production-specific settings
)

echo Docker is ready
echo Configuration files found
echo.

REM Production menu
echo Choose production deployment option:
echo 1. Start production containers
echo 2. Clean rebuild and start
echo 3. View production logs
echo 4. Stop production containers
echo.
set /p choice=Enter choice (1-4): 

if "%choice%"=="2" goto rebuild
if "%choice%"=="3" goto logs
if "%choice%"=="4" goto stop
goto normal

:normal
echo Starting production containers...
docker-compose -f docker-compose.prod.yml up -d --build
goto success

:rebuild
echo Cleaning and rebuilding production containers...
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans
docker-compose -f docker-compose.prod.yml up -d --build
goto success

:logs
echo Viewing production logs...
docker-compose -f docker-compose.prod.yml logs -f web
goto end

:stop
echo Stopping production containers...
docker-compose -f docker-compose.prod.yml down
echo Production containers stopped.
goto end

:success
echo.
echo ✅ Production application started successfully!
echo.
echo 🌐 Access Points:
echo   Main Application:     http://localhost:51235
echo   Production API:       http://localhost:8080 (external)
echo.
echo 📋 Production Commands:
echo   View logs:            docker-compose -f docker-compose.prod.yml logs -f web
echo   Stop service:         docker-compose -f docker-compose.prod.yml down
echo   Restart service:      docker-compose -f docker-compose.prod.yml restart web
echo.
echo ⚠️  Important:
echo   Make sure your production API is running at http://localhost:8080
echo   Update .env.production with your production Firebase credentials
echo.

:end
pause
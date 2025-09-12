@echo off

echo Integration Testing for The Wheel Application
echo Includes: Main App, Mock API Service, and User Management UI
echo ============================================================

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo Starting services for integration testing...
docker-compose up -d

REM Wait for services to be ready
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

echo.
echo Testing service health endpoints...
echo.

REM Test Mock API Service
echo Testing Mock API Service (http://localhost:3001)...
curl -f -s http://localhost:3001/health >nul
if errorlevel 1 (
    echo ❌ Mock API Service health check failed
    set "api_status=FAILED"
) else (
    echo ✅ Mock API Service is healthy
    set "api_status=OK"
)

REM Test User Management UI
echo Testing User Management UI (http://localhost:3002)...
curl -f -s http://localhost:3002/health >nul
if errorlevel 1 (
    echo ❌ User Management UI health check failed
    set "ui_status=FAILED"
) else (
    echo ✅ User Management UI is healthy
    set "ui_status=OK"
)

REM Test Main Application
echo Testing Main Application (http://localhost:51235)...
curl -f -s http://localhost:51235 >nul
if errorlevel 1 (
    echo ❌ Main Application health check failed
    set "main_status=FAILED"
) else (
    echo ✅ Main Application is accessible
    set "main_status=OK"
)

echo.
echo Testing API endpoints...
echo.

REM Test user management endpoints
echo Testing user management endpoints...
curl -f -s -H "Content-Type: application/json" http://localhost:3001/api/users >nul
if errorlevel 1 (
    echo ❌ User management API endpoint failed
    set "user_api_status=FAILED"
) else (
    echo ✅ User management API endpoint is working
    set "user_api_status=OK"
)

REM Test authentication endpoints
echo Testing authentication endpoints...
curl -f -s -H "Content-Type: application/json" http://localhost:3001/api/auth/login >nul 2>&1
REM Note: This will return 400 (bad request) but that means the endpoint is accessible
if errorlevel 1 (
    REM Check if it's a 400 error (expected) vs connection error
    curl -s -w "%%{http_code}" http://localhost:3001/api/auth/login | findstr "400" >nul
    if errorlevel 1 (
        echo ❌ Authentication API endpoint failed
        set "auth_api_status=FAILED"
    ) else (
        echo ✅ Authentication API endpoint is working
        set "auth_api_status=OK"
    )
) else (
    echo ✅ Authentication API endpoint is working
    set "auth_api_status=OK"
)

echo.
echo ============================================================
echo Integration Test Results:
echo ============================================================
echo Main Application:        %main_status%
echo Mock API Service:        %api_status%
echo User Management UI:      %ui_status%
echo User Management API:     %user_api_status%
echo Authentication API:      %auth_api_status%
echo ============================================================

REM Check if all tests passed
if "%main_status%"=="OK" if "%api_status%"=="OK" if "%ui_status%"=="OK" if "%user_api_status%"=="OK" if "%auth_api_status%"=="OK" (
    echo.
    echo ✅ All integration tests PASSED!
    echo.
    echo 🌐 Access Points:
    echo   Main Application:     http://localhost:51235
    echo   Mock API Service:     http://localhost:3001
    echo   User Management UI:   http://localhost:3002
    echo.
    echo Services are ready for testing!
) else (
    echo.
    echo ❌ Some integration tests FAILED!
    echo Please check the service logs for more details:
    echo   docker-compose logs
    echo.
)

echo.
echo Press any key to stop services or Ctrl+C to keep them running...
pause >nul

echo Stopping services...
docker-compose down

echo Integration testing completed.
pause
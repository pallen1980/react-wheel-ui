@echo off
REM Integration Testing Script for Mock API Service with Frontend (Windows)

setlocal enabledelayedexpansion

echo ========================================
echo Mock API Integration Testing Script
echo ========================================

REM Configuration
set "API_BASE_URL=http://localhost:3001"
set "FRONTEND_URL=http://localhost:51235"
set "FRONTEND_DIR=..\.."
set "TIMEOUT=30"
set "CLEANUP=true"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--api-url" (
    set "API_BASE_URL=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--frontend-url" (
    set "FRONTEND_URL=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--frontend-dir" (
    set "FRONTEND_DIR=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--timeout" (
    set "TIMEOUT=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--no-cleanup" (
    set "CLEANUP=false"
    shift
    goto :parse_args
)
if /i "%~1"=="--help" (
    goto :show_help
)
echo Unknown argument: %~1
goto :show_help

:args_done

echo API Base URL: %API_BASE_URL%
echo Frontend URL: %FRONTEND_URL%
echo Frontend Directory: %FRONTEND_DIR%
echo Timeout: %TIMEOUT% seconds
echo Cleanup: %CLEANUP%
echo.

REM Check prerequisites
echo Checking prerequisites...
curl --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: curl is not available. Please install curl.
    exit /b 1
)

docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not available. Please install Docker.
    exit /b 1
)

npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm is not available. Please install Node.js.
    exit /b 1
)

echo ✓ Prerequisites check passed
echo.

REM Step 1: Start Mock API Service
echo [STEP 1] Starting Mock API Service...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to start Mock API Service
    exit /b 1
)

REM Wait for API to be ready
echo Waiting for API to be ready...
set /a "count=0"
:wait_api
curl -s "%API_BASE_URL%/health" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✓ Mock API Service is ready
    goto :api_ready
)
set /a "count+=1"
if %count% geq %TIMEOUT% (
    echo ERROR: API service did not start within %TIMEOUT% seconds
    goto :cleanup_and_exit
)
timeout /t 1 /nobreak >nul
goto :wait_api

:api_ready
echo.

REM Step 2: Configure Frontend Environment
echo [STEP 2] Configuring Frontend Environment...
if not exist "%FRONTEND_DIR%" (
    echo ERROR: Frontend directory not found: %FRONTEND_DIR%
    goto :cleanup_and_exit
)

REM Create or update .env file for frontend
echo VITE_API_BASE_URL=%API_BASE_URL% > "%FRONTEND_DIR%\.env.local"
echo ✓ Frontend environment configured
echo.

REM Step 3: Install Frontend Dependencies (if needed)
echo [STEP 3] Checking Frontend Dependencies...
pushd "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        popd
        goto :cleanup_and_exit
    )
)
echo ✓ Frontend dependencies ready
popd
echo.

REM Step 4: Start Frontend Development Server
echo [STEP 4] Starting Frontend Development Server...
pushd "%FRONTEND_DIR%"
start /b npm run dev
popd

REM Wait for frontend to be ready
echo Waiting for frontend to be ready...
set /a "count=0"
:wait_frontend
curl -s "%FRONTEND_URL%" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✓ Frontend is ready
    goto :frontend_ready
)
set /a "count+=1"
if %count% geq %TIMEOUT% (
    echo ERROR: Frontend did not start within %TIMEOUT% seconds
    goto :cleanup_and_exit
)
timeout /t 1 /nobreak >nul
goto :wait_frontend

:frontend_ready
echo.

REM Step 5: Run Integration Tests
echo [STEP 5] Running Integration Tests...
echo.

REM Test API endpoints
echo Testing API endpoints...
call scripts\test-api.bat --integration --url %API_BASE_URL%
if %ERRORLEVEL% neq 0 (
    echo ERROR: API tests failed
    goto :cleanup_and_exit
)
echo.

REM Test CORS configuration
echo Testing CORS configuration...
curl -s -H "Origin: %FRONTEND_URL%" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -X OPTIONS "%API_BASE_URL%/api/auth/login" -w "%%{http_code}" > temp_cors.txt
set /p CORS_STATUS=<temp_cors.txt
if "%CORS_STATUS%"=="200" (
    echo ✓ CORS configuration working
) else (
    echo ✗ CORS configuration failed (Status: %CORS_STATUS%)
)
del temp_cors.txt 2>nul
echo.

REM Test authentication flow
echo Testing authentication flow...
echo {"email":"test@example.com","password":"password123"} > temp_login.json
curl -s -H "Origin: %FRONTEND_URL%" -H "Content-Type: application/json" -d @temp_login.json "%API_BASE_URL%/api/auth/login" -w "%%{http_code}" > temp_auth.txt
set /p AUTH_STATUS=<temp_auth.txt
if "%AUTH_STATUS%"=="200" (
    echo ✓ Authentication flow working
) else (
    echo ✗ Authentication flow failed (Status: %AUTH_STATUS%)
)
del temp_login.json temp_auth.txt 2>nul
echo.

REM Step 6: Manual Testing Instructions
echo [STEP 6] Manual Testing Instructions...
echo.
echo ========================================
echo Integration Test Environment Ready!
echo ========================================
echo.
echo Frontend URL: %FRONTEND_URL%
echo API URL: %API_BASE_URL%
echo.
echo Manual Test Steps:
echo 1. Open browser to %FRONTEND_URL%
echo 2. Test user login with:
echo    Email: test@example.com
echo    Password: password123
echo 3. Create and save wheel options
echo 4. Verify options persist after page refresh
echo 5. Test logout and login again
echo.
echo API Test Endpoints:
echo - Health: %API_BASE_URL%/health
echo - Login: %API_BASE_URL%/api/auth/login
echo - Options: %API_BASE_URL%/api/users/{userId}/options
echo.
echo Press any key to stop services and cleanup...
pause >nul

:cleanup_and_exit
if "%CLEANUP%"=="true" (
    echo.
    echo Cleaning up...
    
    REM Stop frontend (kill npm processes)
    taskkill /f /im node.exe 2>nul
    
    REM Stop API service
    docker-compose down
    
    REM Remove temporary environment file
    if exist "%FRONTEND_DIR%\.env.local" del "%FRONTEND_DIR%\.env.local"
    
    echo ✓ Cleanup completed
)

echo.
echo ========================================
echo Integration Testing Completed
echo ========================================
exit /b 0

:show_help
echo Usage: integration-test.bat [OPTIONS]
echo.
echo Options:
echo   --api-url URL         Set API base URL [default: http://localhost:3001]
echo   --frontend-url URL    Set frontend URL [default: http://localhost:51235]
echo   --frontend-dir DIR    Set frontend directory [default: ..\..] 
echo   --timeout SECONDS     Set startup timeout [default: 30]
echo   --no-cleanup         Don't cleanup services after testing
echo   --help               Show this help message
echo.
echo Examples:
echo   integration-test.bat                    # Run with defaults
echo   integration-test.bat --no-cleanup      # Keep services running
echo   integration-test.bat --timeout 60      # Wait longer for startup
exit /b 0
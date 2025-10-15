@echo off
REM API Testing Script for Mock API Service (Windows)

setlocal enabledelayedexpansion

echo ========================================
echo Mock API Service Testing Script
echo ========================================

REM Configuration
set "API_BASE_URL=http://localhost:3001"
set "TEST_EMAIL=test@example.com"
set "TEST_PASSWORD=password123"
set "NEW_USER_EMAIL=testuser_%RANDOM%@example.com"
set "ACCESS_TOKEN="
set "USER_ID="

REM Parse command line arguments
set "RUN_INTEGRATION=false"
set "VERBOSE=false"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--integration" (
    set "RUN_INTEGRATION=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--verbose" (
    set "VERBOSE=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--url" (
    set "API_BASE_URL=%~2"
    shift
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
echo Run Integration Tests: %RUN_INTEGRATION%
echo Verbose Output: %VERBOSE%
echo.

REM Check if curl is available
curl --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: curl is not available. Please install curl to run API tests.
    exit /b 1
)

REM Test 1: Health Check
echo [TEST 1] Health Check...
curl -s -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/health" > temp_status.txt
set /p STATUS=<temp_status.txt
if "%STATUS%"=="200" (
    echo ✓ Health check passed
) else (
    echo ✗ Health check failed (Status: %STATUS%)
    if "%VERBOSE%"=="true" type temp_response.json
)
echo.

REM Test 2: Login with test user
echo [TEST 2] Login with test user...
echo {"email":"%TEST_EMAIL%","password":"%TEST_PASSWORD%"} > temp_login.json
curl -s -X POST -H "Content-Type: application/json" -d @temp_login.json -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/v1/auth/login" > temp_status.txt
set /p STATUS=<temp_status.txt
if "%STATUS%"=="200" (
    echo ✓ Login successful
    REM Extract access token (basic parsing)
    for /f "tokens=2 delims=:," %%a in ('findstr "idToken" temp_response.json') do (
        set "ACCESS_TOKEN=%%a"
        set "ACCESS_TOKEN=!ACCESS_TOKEN:"=!"
        set "ACCESS_TOKEN=!ACCESS_TOKEN: =!"
    )
    for /f "tokens=2 delims=:," %%a in ('findstr "localId" temp_response.json') do (
        set "USER_ID=%%a"
        set "USER_ID=!USER_ID:"=!"
        set "USER_ID=!USER_ID: =!"
    )
) else (
    echo ✗ Login failed (Status: %STATUS%)
    if "%VERBOSE%"=="true" type temp_response.json
)
echo.

REM Test 3: Register new user
echo [TEST 3] Register new user...
echo {"email":"%NEW_USER_EMAIL%","password":"%TEST_PASSWORD%","displayName":"Test User"} > temp_register.json
curl -s -X POST -H "Content-Type: application/json" -d @temp_register.json -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/v1/auth/register" > temp_status.txt
set /p STATUS=<temp_status.txt
if "%STATUS%"=="200" (
    echo ✓ Registration successful
) else (
    echo ✗ Registration failed (Status: %STATUS%)
    if "%VERBOSE%"=="true" type temp_response.json
)
echo.

REM Test 4: Get user options (should return 404 for new user)
if not "%ACCESS_TOKEN%"=="" if not "%USER_ID%"=="" (
    echo [TEST 4] Get user options (expecting 404)...
    curl -s -H "Authorization: Bearer %ACCESS_TOKEN%" -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/v1/users/%USER_ID%/options" > temp_status.txt
    set /p STATUS=<temp_status.txt
    if "%STATUS%"=="404" (
        echo ✓ Get options returned 404 as expected (no saved options)
    ) else (
        echo ✗ Get options unexpected status (Status: %STATUS%)
        if "%VERBOSE%"=="true" type temp_response.json
    )
    echo.
    
    REM Test 5: Save user options
    echo [TEST 5] Save user options...
    echo {"options":[{"key":"option1","value":"Option 1","sequence":1},{"key":"option2","value":"Option 2","sequence":2}]} > temp_options.json
    curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer %ACCESS_TOKEN%" -d @temp_options.json -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/v1/users/%USER_ID%/options" > temp_status.txt
    set /p STATUS=<temp_status.txt
    if "%STATUS%"=="200" (
        echo ✓ Save options successful
    ) else (
        echo ✗ Save options failed (Status: %STATUS%)
        if "%VERBOSE%"=="true" type temp_response.json
    )
    echo.
    
    REM Test 6: Get user options (should return saved options)
    echo [TEST 6] Get user options (expecting saved data)...
    curl -s -H "Authorization: Bearer %ACCESS_TOKEN%" -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/v1/users/%USER_ID%/options" > temp_status.txt
    set /p STATUS=<temp_status.txt
    if "%STATUS%"=="200" (
        echo ✓ Get options returned saved data
        if "%VERBOSE%"=="true" type temp_response.json
    ) else (
        echo ✗ Get options failed (Status: %STATUS%)
        if "%VERBOSE%"=="true" type temp_response.json
    )
    echo.
) else (
    echo [SKIP] Skipping authenticated tests - login failed
)

REM Test 7: Unauthorized access
echo [TEST 7] Test unauthorized access...
curl -s -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/v1/users/test-user/options" > temp_status.txt
set /p STATUS=<temp_status.txt
if "%STATUS%"=="401" (
    echo ✓ Unauthorized access properly rejected
) else (
    echo ✗ Unauthorized access not properly handled (Status: %STATUS%)
    if "%VERBOSE%"=="true" type temp_response.json
)
echo.

REM Integration tests with frontend
if "%RUN_INTEGRATION%"=="true" (
    echo ========================================
    echo Running Integration Tests
    echo ========================================
    call :run_integration_tests
)

REM Cleanup
del temp_*.json 2>nul
del temp_*.txt 2>nul

echo ========================================
echo API Testing Completed
echo ========================================
exit /b 0

:run_integration_tests
echo [INTEGRATION] Testing CORS headers...
curl -s -H "Origin: http://localhost:51235" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -X OPTIONS -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/v1/auth/login" > temp_status.txt
set /p STATUS=<temp_status.txt
if "%STATUS%"=="200" (
    echo ✓ CORS preflight successful
) else (
    echo ✗ CORS preflight failed (Status: %STATUS%)
)

echo [INTEGRATION] Testing with frontend origin...
curl -s -H "Origin: http://localhost:51235" -H "Content-Type: application/json" -d "{\"email\":\"%TEST_EMAIL%\",\"password\":\"%TEST_PASSWORD%\"}" -o temp_response.json -w "%%{http_code}" "%API_BASE_URL%/v1/auth/login" > temp_status.txt
set /p STATUS=<temp_status.txt
if "%STATUS%"=="200" (
    echo ✓ Frontend origin request successful
) else (
    echo ✗ Frontend origin request failed (Status: %STATUS%)
)
echo.
goto :eof

:show_help
echo Usage: test-api.bat [OPTIONS]
echo.
echo Options:
echo   --integration        Run integration tests with frontend
echo   --verbose           Show detailed response output
echo   --url URL           Set custom API base URL [default: http://localhost:3001]
echo   --help              Show this help message
echo.
echo Examples:
echo   test-api.bat                        # Run basic API tests
echo   test-api.bat --integration          # Run with integration tests
echo   test-api.bat --verbose              # Run with detailed output
echo   test-api.bat --url http://localhost:8080  # Test different URL
exit /b 0

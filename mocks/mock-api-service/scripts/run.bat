@echo off
REM Main script runner for Mock API Service (Windows)

setlocal enabledelayedexpansion

if "%~1"=="" goto :show_help
if /i "%~1"=="help" goto :show_help
if /i "%~1"=="--help" goto :show_help

set "COMMAND=%~1"
shift

REM Route to appropriate script
if /i "%COMMAND%"=="deploy" (
    call scripts\deploy.bat %*
) else if /i "%COMMAND%"=="test" (
    call scripts\test-api.bat %*
) else if /i "%COMMAND%"=="integration" (
    call scripts\integration-test.bat %*
) else if /i "%COMMAND%"=="build" (
    call build-docker.bat %*
) else if /i "%COMMAND%"=="start" (
    docker-compose up -d
) else if /i "%COMMAND%"=="stop" (
    docker-compose down
) else if /i "%COMMAND%"=="logs" (
    docker-compose logs -f mock-api
) else if /i "%COMMAND%"=="status" (
    docker-compose ps
    echo.
    echo Health check:
    curl -s http://localhost:3001/health
) else if /i "%COMMAND%"=="clean" (
    echo Cleaning up Docker resources...
    docker-compose down
    docker rmi mock-api-service:latest 2>nul
    echo Cleanup completed.
) else (
    echo Unknown command: %COMMAND%
    echo.
    goto :show_help
)

exit /b %ERRORLEVEL%

:show_help
echo Mock API Service Script Runner
echo.
echo Usage: run.bat COMMAND [OPTIONS]
echo.
echo Commands:
echo   deploy      Deploy the Mock API Service
echo   test        Run API endpoint tests
echo   integration Run integration tests with frontend
echo   build       Build Docker image only
echo   start       Start services using docker-compose
echo   stop        Stop services
echo   logs        View service logs
echo   status      Show service status and health
echo   clean       Clean up Docker resources
echo   help        Show this help message
echo.
echo Examples:
echo   run.bat deploy                    # Deploy in development mode
echo   run.bat deploy --env production   # Deploy in production mode
echo   run.bat test --integration        # Run API tests with integration
echo   run.bat integration               # Run full integration tests
echo   run.bat build                     # Build Docker image
echo   run.bat start                     # Start services
echo   run.bat stop                      # Stop services
echo   run.bat logs                      # View logs
echo   run.bat status                    # Check status
echo   run.bat clean                     # Clean up
echo.
echo For command-specific help, use:
echo   run.bat COMMAND --help
exit /b 0
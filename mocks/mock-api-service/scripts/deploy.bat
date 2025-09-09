@echo off
REM Comprehensive deployment script for Mock API Service (Windows)

setlocal enabledelayedexpansion

echo ========================================
echo Mock API Service Deployment Script
echo ========================================

REM Parse command line arguments
set "ENVIRONMENT=development"
set "BUILD_ONLY=false"
set "CLEAN=false"

:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--env" (
    set "ENVIRONMENT=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--build-only" (
    set "BUILD_ONLY=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--clean" (
    set "CLEAN=true"
    shift
    goto :parse_args
)
if /i "%~1"=="--help" (
    goto :show_help
)
echo Unknown argument: %~1
goto :show_help

:args_done

echo Environment: %ENVIRONMENT%
echo Build only: %BUILD_ONLY%
echo Clean build: %CLEAN%
echo.

REM Clean up if requested
if "%CLEAN%"=="true" (
    echo Cleaning up existing containers and images...
    docker stop mock-api-service 2>nul
    docker rm mock-api-service 2>nul
    docker rmi mock-api-service:latest 2>nul
    echo Clean up completed.
    echo.
)

REM Build the Docker image
echo Building Docker image...
docker build -t mock-api-service:latest .
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker build failed!
    exit /b 1
)
echo Docker image built successfully!
echo.

REM Exit if build-only mode
if "%BUILD_ONLY%"=="true" (
    echo Build completed. Exiting (build-only mode).
    exit /b 0
)

REM Stop existing container if running
echo Stopping existing container...
docker stop mock-api-service 2>nul
docker rm mock-api-service 2>nul

REM Choose docker-compose file based on environment
set "COMPOSE_FILE=docker-compose.yml"
if /i "%ENVIRONMENT%"=="production" (
    set "COMPOSE_FILE=docker-compose.yml -f docker-compose.prod.yml"
)

REM Start the service
echo Starting Mock API Service in %ENVIRONMENT% mode...
docker-compose -f %COMPOSE_FILE% up -d

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to start the service!
    exit /b 1
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo Service URL: http://localhost:3001
echo Health check: http://localhost:3001/health
echo API Documentation: http://localhost:3001/swagger
echo.
echo To view logs: docker-compose logs -f mock-api
echo To stop service: docker-compose down
echo ========================================

exit /b 0

:show_help
echo Usage: deploy.bat [OPTIONS]
echo.
echo Options:
echo   --env ENVIRONMENT    Set environment (development/production) [default: development]
echo   --build-only         Only build the Docker image, don't start services
echo   --clean              Clean up existing containers and images before building
echo   --help               Show this help message
echo.
echo Examples:
echo   deploy.bat                           # Deploy in development mode
echo   deploy.bat --env production          # Deploy in production mode
echo   deploy.bat --build-only              # Only build the image
echo   deploy.bat --clean --env production  # Clean build and deploy in production
exit /b 0
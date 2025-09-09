@echo off
REM Batch script to build the Mock API Service Docker image

echo Building Mock API Service Docker image...

docker build -t mock-api-service:latest .

if %ERRORLEVEL% EQU 0 (
    echo Docker image built successfully!
    echo To run the container:
    echo docker run -p 3001:3001 mock-api-service:latest
) else (
    echo Docker build failed!
    exit /b 1
)
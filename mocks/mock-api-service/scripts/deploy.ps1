# Comprehensive deployment script for Mock API Service (PowerShell)

param(
    [string]$Environment = "development",
    [switch]$BuildOnly,
    [switch]$Clean,
    [switch]$Help
)

function Show-Help {
    Write-Host "Usage: .\deploy.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -Environment ENVIRONMENT  Set environment (development/production) [default: development]" -ForegroundColor White
    Write-Host "  -BuildOnly               Only build the Docker image, don't start services" -ForegroundColor White
    Write-Host "  -Clean                   Clean up existing containers and images before building" -ForegroundColor White
    Write-Host "  -Help                    Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\deploy.ps1                              # Deploy in development mode" -ForegroundColor White
    Write-Host "  .\deploy.ps1 -Environment production      # Deploy in production mode" -ForegroundColor White
    Write-Host "  .\deploy.ps1 -BuildOnly                   # Only build the image" -ForegroundColor White
    Write-Host "  .\deploy.ps1 -Clean -Environment production # Clean build and deploy in production" -ForegroundColor White
    exit 0
}

if ($Help) {
    Show-Help
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mock API Service Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Build only: $BuildOnly" -ForegroundColor Yellow
Write-Host "Clean build: $Clean" -ForegroundColor Yellow
Write-Host ""

# Clean up if requested
if ($Clean) {
    Write-Host "Cleaning up existing containers and images..." -ForegroundColor Green
    docker stop mock-api-service 2>$null
    docker rm mock-api-service 2>$null
    docker rmi mock-api-service:latest 2>$null
    Write-Host "Clean up completed." -ForegroundColor Green
    Write-Host ""
}

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Green
docker build -t mock-api-service:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Docker image built successfully!" -ForegroundColor Green
Write-Host ""

# Exit if build-only mode
if ($BuildOnly) {
    Write-Host "Build completed. Exiting (build-only mode)." -ForegroundColor Yellow
    exit 0
}

# Stop existing container if running
Write-Host "Stopping existing container..." -ForegroundColor Green
docker stop mock-api-service 2>$null
docker rm mock-api-service 2>$null

# Choose docker-compose file based on environment
$ComposeFiles = "docker-compose.yml"
if ($Environment -eq "production") {
    $ComposeFiles = "docker-compose.yml -f docker-compose.prod.yml"
}

# Start the service
Write-Host "Starting Mock API Service in $Environment mode..." -ForegroundColor Green
$composeCommand = "docker-compose -f $ComposeFiles up -d"
Invoke-Expression $composeCommand

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start the service!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service URL: http://localhost:3001" -ForegroundColor Yellow
Write-Host "Health check: http://localhost:3001/health" -ForegroundColor Yellow
Write-Host "API Documentation: http://localhost:3001/swagger" -ForegroundColor Yellow
Write-Host ""
Write-Host "To view logs: docker-compose logs -f mock-api" -ForegroundColor White
Write-Host "To stop service: docker-compose down" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Runs The Wheel application in production mode using Docker Compose

.DESCRIPTION
    This script runs the application in production mode, connecting to an external
    production API at http://localhost:8080 instead of the mock services.

.PARAMETER Clean
    Remove existing containers and volumes before starting

.EXAMPLE
    .\run-docker-prod.ps1
    Run the application in production mode

.EXAMPLE
    .\run-docker-prod.ps1 -Clean
    Clean rebuild and start the application in production mode
#>

param(
    [switch]$Clean
)

# Function to load environment variables from .env file
function Load-EnvFile {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Error "Environment file not found: $FilePath"
        exit 1
    }

    Write-Host "Loading environment variables from $FilePath..." -ForegroundColor Green
    
    $envVars = @{}
    Get-Content $FilePath | ForEach-Object {
        $line = $_.Trim()
        # Skip empty lines and comments
        if ($line -and -not $line.StartsWith('#')) {
            # Handle lines with = sign
            if ($line -match '^([^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                # Remove quotes if present
                if (($value.StartsWith('"') -and $value.EndsWith('"')) -or 
                    ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                
                $envVars[$key] = $value
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    
    return $envVars
}

# Main execution
try {
    Write-Host "🎡 Starting The Wheel Application in PRODUCTION MODE" -ForegroundColor Magenta
    Write-Host "Connecting to production API at http://localhost:8080" -ForegroundColor Yellow
    Write-Host "=================================================" -ForegroundColor Magenta
    
    # Check if Docker is running
    try {
        docker version | Out-Null
    } catch {
        Write-Error "Docker is not running or not installed. Please start Docker Desktop and try again."
        exit 1
    }
    
    # Check if docker-compose files exist
    if (-not (Test-Path "docker-compose.prod.yml")) {
        Write-Error "docker-compose.prod.yml not found in current directory"
        exit 1
    }
    
    # Load production environment variables
    $envFile = if (Test-Path ".env.production") { ".env.production" } else { ".env" }
    $envVars = Load-EnvFile $envFile
    
    Write-Host "`n=== Production Configuration ===" -ForegroundColor Cyan
    Write-Host "Environment File: $envFile" -ForegroundColor White
    Write-Host "Production API: $($envVars['VITE_API_BASE_URL'])" -ForegroundColor Yellow
    Write-Host "Firebase Project: $($envVars['VITE_FIREBASE_PROJECT_ID'])" -ForegroundColor White
    Write-Host "Application Port: 51235" -ForegroundColor White
    Write-Host "==============================`n" -ForegroundColor Cyan
    
    # Clean up if requested
    if ($Clean) {
        Write-Host "🧹 Cleaning up existing containers and volumes..." -ForegroundColor Yellow
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --volumes --remove-orphans
        docker system prune -f
    }
    
    # Start production containers
    Write-Host "🚀 Starting production containers..." -ForegroundColor Green
    Write-Host "Executing: docker-compose -f docker-compose.prod.yml up -d --build" -ForegroundColor Gray
    
    & docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Production application started successfully!" -ForegroundColor Green
        Write-Host "`n🌐 Access Points:" -ForegroundColor Cyan
        Write-Host "  Main Application:     http://localhost:51235" -ForegroundColor White
        Write-Host "  Production API:       http://localhost:8080 (external)" -ForegroundColor Yellow
        
        Write-Host "`n📋 Production Commands:" -ForegroundColor Yellow
        Write-Host "  View logs:            docker-compose -f docker-compose.prod.yml logs -f web" -ForegroundColor Gray
        Write-Host "  Stop service:         docker-compose -f docker-compose.prod.yml down" -ForegroundColor Gray
        Write-Host "  Restart service:      docker-compose -f docker-compose.prod.yml restart web" -ForegroundColor Gray
        Write-Host "  Health check:         docker-compose -f docker-compose.prod.yml ps" -ForegroundColor Gray
        
        Write-Host "`n⚠️  Important:" -ForegroundColor Red
        Write-Host "  Make sure your production API is running at http://localhost:8080" -ForegroundColor Yellow
        Write-Host "  Update .env.production with your production Firebase credentials" -ForegroundColor Yellow
    } else {
        Write-Error "Failed to start the production application. Check the logs above for details."
        exit 1
    }
    
} catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    exit 1
}
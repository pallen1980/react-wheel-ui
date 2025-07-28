#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Runs The Wheel application using Docker Compose with environment variables from .env file

.DESCRIPTION
    This script loads environment variables from the .env file and runs docker-compose up
    with all the necessary Firebase and API configuration values.

.PARAMETER Detached
    Run containers in detached mode (background)

.PARAMETER Build
    Force rebuild of images before starting

.PARAMETER Clean
    Remove existing containers and volumes before starting

.EXAMPLE
    .\run-docker.ps1
    Run the application in foreground mode

.EXAMPLE
    .\run-docker.ps1 -Detached
    Run the application in background mode

.EXAMPLE
    .\run-docker.ps1 -Build -Clean
    Clean rebuild and start the application
#>

param(
    [switch]$Detached,
    [switch]$Build,
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

# Function to validate required environment variables
function Test-RequiredEnvVars {
    param([hashtable]$EnvVars)
    
    $requiredVars = @(
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_DATABASE_URL',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
    )
    
    $missing = @()
    foreach ($var in $requiredVars) {
        if (-not $EnvVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($EnvVars[$var])) {
            $missing += $var
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "Missing required environment variables: $($missing -join ', ')"
        Write-Host "Please check your .env file and ensure all Firebase configuration values are set." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✓ All required environment variables are present" -ForegroundColor Green
}

# Function to display configuration summary
function Show-ConfigSummary {
    param([hashtable]$EnvVars)
    
    Write-Host "`n=== Configuration Summary ===" -ForegroundColor Cyan
    Write-Host "Firebase Project ID: $($EnvVars['VITE_FIREBASE_PROJECT_ID'])" -ForegroundColor White
    Write-Host "Firebase Auth Domain: $($EnvVars['VITE_FIREBASE_AUTH_DOMAIN'])" -ForegroundColor White
    
    if ($EnvVars.ContainsKey('VITE_API_BASE_URL') -and -not [string]::IsNullOrWhiteSpace($EnvVars['VITE_API_BASE_URL'])) {
        Write-Host "Custom API Base URL: $($EnvVars['VITE_API_BASE_URL'])" -ForegroundColor Yellow
    } else {
        Write-Host "API Base URL: /api (default)" -ForegroundColor Gray
    }
    
    Write-Host "Container Port: 51235" -ForegroundColor White
    Write-Host "==============================`n" -ForegroundColor Cyan
}

# Main execution
try {
    Write-Host "🎡 Starting The Wheel Application with Docker Compose" -ForegroundColor Magenta
    Write-Host "======================================================" -ForegroundColor Magenta
    
    # Check if Docker is running
    try {
        docker version | Out-Null
    } catch {
        Write-Error "Docker is not running or not installed. Please start Docker Desktop and try again."
        exit 1
    }
    
    # Check if docker-compose.yml exists
    if (-not (Test-Path "docker-compose.yml")) {
        Write-Error "docker-compose.yml not found in current directory"
        exit 1
    }
    
    # Load environment variables
    $envVars = Load-EnvFile ".env"
    
    # Validate required variables
    Test-RequiredEnvVars $envVars
    
    # Show configuration summary
    Show-ConfigSummary $envVars
    
    # Clean up if requested
    if ($Clean) {
        Write-Host "🧹 Cleaning up existing containers and volumes..." -ForegroundColor Yellow
        docker-compose down --volumes --remove-orphans
        docker system prune -f
    }
    
    # Build Docker Compose command
    $composeArgs = @("up")
    
    if ($Detached) {
        $composeArgs += "--detach"
        Write-Host "🚀 Starting containers in detached mode..." -ForegroundColor Green
    } else {
        Write-Host "🚀 Starting containers in foreground mode (Ctrl+C to stop)..." -ForegroundColor Green
    }
    
    if ($Build) {
        $composeArgs += "--build"
        Write-Host "🔨 Force rebuilding images..." -ForegroundColor Yellow
    }
    
    # Run docker-compose
    Write-Host "Executing: docker-compose $($composeArgs -join ' ')" -ForegroundColor Gray
    & docker-compose @composeArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Application started successfully!" -ForegroundColor Green
        Write-Host "🌐 Access the application at: http://localhost:51235" -ForegroundColor Cyan
        
        if ($Detached) {
            Write-Host "`nUseful commands:" -ForegroundColor Yellow
            Write-Host "  View logs: docker-compose logs -f" -ForegroundColor Gray
            Write-Host "  Stop app:  docker-compose down" -ForegroundColor Gray
            Write-Host "  Restart:   docker-compose restart" -ForegroundColor Gray
        }
    } else {
        Write-Error "Failed to start the application. Check the logs above for details."
        exit 1
    }
    
} catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    exit 1
}
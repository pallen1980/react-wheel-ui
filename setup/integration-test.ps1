#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Integration testing script for The Wheel application services

.DESCRIPTION
    This script starts all services (Main App, Mock API, User Management UI) and runs
    comprehensive integration tests to verify all components are working correctly.

.PARAMETER KeepRunning
    Keep services running after tests complete

.PARAMETER Verbose
    Show detailed test output

.EXAMPLE
    .\integration-test.ps1
    Run integration tests and stop services afterward

.EXAMPLE
    .\integration-test.ps1 -KeepRunning
    Run integration tests and keep services running
#>

param(
    [switch]$KeepRunning,
    [switch]$Verbose
)

# Test results tracking
$testResults = @{
    MainApp = $false
    MockAPI = $false
    UserManagementUI = $false
    UserManagementAPI = $false
    AuthenticationAPI = $false
}

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        if ($Verbose) {
            Write-Host "  Testing $ServiceName at $Url..." -ForegroundColor Gray
        }
        
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $ServiceName is healthy" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $ServiceName returned status code: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $ServiceName health check failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-APIEndpoint {
    param(
        [string]$EndpointName,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [int]$ExpectedStatusCode = 200,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        if ($Verbose) {
            Write-Host "  Testing $EndpointName at $Url..." -ForegroundColor Gray
        }
        
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = $TimeoutSeconds
            UseBasicParsing = $true
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatusCode) {
            Write-Host "✅ $EndpointName is working (Status: $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $EndpointName returned unexpected status: $($response.StatusCode) (Expected: $ExpectedStatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        # For some endpoints, we expect certain error codes (like 400 for auth without credentials)
        if ($_.Exception.Response.StatusCode -eq $ExpectedStatusCode) {
            Write-Host "✅ $EndpointName is working (Expected error: $($_.Exception.Response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $EndpointName failed: $($_.Exception.Message)" -ForegroundColor Red
            return $false
        }
    }
}

function Wait-ForServices {
    param([int]$Seconds = 15)
    
    Write-Host "⏳ Waiting $Seconds seconds for services to start..." -ForegroundColor Yellow
    
    for ($i = $Seconds; $i -gt 0; $i--) {
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 1
    }
    Write-Host ""
}

# Main execution
try {
    Write-Host "🧪 Integration Testing for The Wheel Application" -ForegroundColor Magenta
    Write-Host "Includes: Main App, Mock API Service, and User Management UI" -ForegroundColor Magenta
    Write-Host "============================================================" -ForegroundColor Magenta
    
    # Check if Docker is running
    try {
        docker version | Out-Null
    } catch {
        Write-Error "Docker is not running or not installed. Please start Docker Desktop and try again."
        exit 1
    }
    
    # Load environment variables if .env exists
    if (Test-Path ".env") {
        Write-Host "📋 Loading environment variables from .env file..." -ForegroundColor Cyan
        Get-Content ".env" | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    # Start services
    Write-Host "🚀 Starting services for integration testing..." -ForegroundColor Green
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start services with docker-compose"
        exit 1
    }
    
    # Wait for services to be ready
    Wait-ForServices -Seconds 20
    
    Write-Host "`n🏥 Testing service health endpoints..." -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    
    # Test service health endpoints
    $testResults.MockAPI = Test-ServiceHealth "Mock API Service" "http://localhost:3001/health"
    $testResults.UserManagementUI = Test-ServiceHealth "User Management UI" "http://localhost:3002/health"
    $testResults.MainApp = Test-ServiceHealth "Main Application" "http://localhost:51235"
    
    Write-Host "`n🔌 Testing API endpoints..." -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    
    # Test API endpoints
    $headers = @{ "Content-Type" = "application/json" }
    
    $testResults.UserManagementAPI = Test-APIEndpoint "User Management API" "http://localhost:3001/v1/users" -Headers $headers
    
    # Test auth endpoint (expect 400 for empty request)
    $testResults.AuthenticationAPI = Test-APIEndpoint "Authentication API" "http://localhost:3001/v1/auth/login" -Method "POST" -Headers $headers -ExpectedStatusCode 400
    
    # Additional API tests
    Write-Host "`n🔍 Running additional API validation tests..." -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    
    # Test CORS headers
    try {
        $corsTest = Invoke-WebRequest -Uri "http://localhost:3001/v1/users" -Method "OPTIONS" -UseBasicParsing
        if ($corsTest.Headers["Access-Control-Allow-Origin"]) {
            Write-Host "✅ CORS headers are configured correctly" -ForegroundColor Green
        } else {
            Write-Host "⚠️  CORS headers may not be configured" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not test CORS configuration" -ForegroundColor Yellow
    }
    
    # Test service connectivity
    try {
        $serviceTest = docker-compose exec -T mock-user-ui wget --spider --quiet http://mock-api:3001/health
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Inter-service communication is working" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Inter-service communication may have issues" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Could not test inter-service communication" -ForegroundColor Yellow
    }
    
    # Display results
    Write-Host "`n============================================================" -ForegroundColor Magenta
    Write-Host "🧪 Integration Test Results" -ForegroundColor Magenta
    Write-Host "============================================================" -ForegroundColor Magenta
    
    $allPassed = $true
    foreach ($test in $testResults.GetEnumerator()) {
        $status = if ($test.Value) { "✅ PASS" } else { "❌ FAIL"; $allPassed = $false }
        $color = if ($test.Value) { "Green" } else { "Red" }
        Write-Host ("{0,-25} {1}" -f $test.Key, $status) -ForegroundColor $color
    }
    
    Write-Host "============================================================" -ForegroundColor Magenta
    
    if ($allPassed) {
        Write-Host "`n🎉 All integration tests PASSED!" -ForegroundColor Green
        Write-Host "`n🌐 Access Points:" -ForegroundColor Cyan
        Write-Host "  Main Application:     http://localhost:51235" -ForegroundColor White
        Write-Host "  Mock API Service:     http://localhost:3001" -ForegroundColor White
        Write-Host "  User Management UI:   http://localhost:3002" -ForegroundColor White
        Write-Host "`n🚀 Services are ready for testing!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Some integration tests FAILED!" -ForegroundColor Red
        Write-Host "Please check the service logs for more details:" -ForegroundColor Yellow
        Write-Host "  docker-compose logs" -ForegroundColor Gray
    }
    
    # Handle service cleanup
    if (-not $KeepRunning) {
        Write-Host "`nPress any key to stop services or Ctrl+C to keep them running..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        
        Write-Host "`n🛑 Stopping services..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "✅ Integration testing completed." -ForegroundColor Green
    } else {
        Write-Host "`n🔄 Services will continue running (--KeepRunning specified)" -ForegroundColor Cyan
        Write-Host "To stop services later, run: docker-compose down" -ForegroundColor Gray
    }
    
} catch {
    Write-Error "An error occurred during integration testing: $($_.Exception.Message)"
    
    # Cleanup on error
    Write-Host "🛑 Cleaning up services due to error..." -ForegroundColor Yellow
    docker-compose down
    exit 1
}

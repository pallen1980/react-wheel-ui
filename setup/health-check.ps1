#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Health check script for The Wheel application services

.DESCRIPTION
    This script checks the health status of all running services and provides
    a quick overview of system status.

.PARAMETER Continuous
    Run health checks continuously every 30 seconds

.PARAMETER Detailed
    Show detailed service information

.EXAMPLE
    .\health-check.ps1
    Run a single health check

.EXAMPLE
    .\health-check.ps1 -Continuous
    Run continuous health monitoring
#>

param(
    [switch]$Continuous,
    [switch]$Detailed
)

function Get-ServiceStatus {
    param([string]$ServiceName, [string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
        return @{
            Name = $ServiceName
            Status = "Healthy"
            StatusCode = $response.StatusCode
            ResponseTime = $response.Headers["X-Response-Time"]
            Color = "Green"
        }
    } catch {
        return @{
            Name = $ServiceName
            Status = "Unhealthy"
            StatusCode = $_.Exception.Response.StatusCode
            Error = $_.Exception.Message
            Color = "Red"
        }
    }
}

function Get-ContainerStatus {
    try {
        $containers = docker-compose ps --format json | ConvertFrom-Json
        return $containers
    } catch {
        return @()
    }
}

function Show-HealthStatus {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    Write-Host "`n🏥 Health Check Report - $timestamp" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    
    # Check container status
    Write-Host "📦 Container Status:" -ForegroundColor Yellow
    $containers = Get-ContainerStatus
    
    if ($containers.Count -eq 0) {
        Write-Host "  No containers running" -ForegroundColor Red
        return
    }
    
    foreach ($container in $containers) {
        $statusColor = switch ($container.State) {
            "running" { "Green" }
            "exited" { "Red" }
            default { "Yellow" }
        }
        
        Write-Host "  $($container.Service): $($container.State)" -ForegroundColor $statusColor
        
        if ($Detailed -and $container.State -eq "running") {
            Write-Host "    Container: $($container.Name)" -ForegroundColor Gray
            Write-Host "    Ports: $($container.Publishers)" -ForegroundColor Gray
        }
    }
    
    # Check service health endpoints
    Write-Host "`n🌐 Service Health:" -ForegroundColor Yellow
    
    $services = @(
        @{ Name = "Mock API Service"; Url = "http://localhost:3001/health" }
        @{ Name = "User Management UI"; Url = "http://localhost:3002/health" }
        @{ Name = "Main Application"; Url = "http://localhost:51235" }
    )
    
    foreach ($service in $services) {
        $status = Get-ServiceStatus $service.Name $service.Url
        Write-Host "  $($status.Name): $($status.Status)" -ForegroundColor $status.Color
        
        if ($Detailed) {
            if ($status.StatusCode) {
                Write-Host "    Status Code: $($status.StatusCode)" -ForegroundColor Gray
            }
            if ($status.ResponseTime) {
                Write-Host "    Response Time: $($status.ResponseTime)" -ForegroundColor Gray
            }
            if ($status.Error) {
                Write-Host "    Error: $($status.Error)" -ForegroundColor Gray
            }
        }
    }
    
    # Check API endpoints
    Write-Host "`n🔌 API Endpoints:" -ForegroundColor Yellow
    
    $apiEndpoints = @(
        @{ Name = "Users API"; Url = "http://localhost:3001/v1/users" }
        @{ Name = "Auth API"; Url = "http://localhost:3001/v1/auth/login"; Method = "POST"; ExpectedStatus = 400 }
    )
    
    foreach ($endpoint in $apiEndpoints) {
        try {
            if ($endpoint.Method -eq "POST") {
                $response = Invoke-WebRequest -Uri $endpoint.Url -Method POST -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
            } else {
                $response = Invoke-WebRequest -Uri $endpoint.Url -TimeoutSec 5 -UseBasicParsing
            }
            
            Write-Host "  $($endpoint.Name): Available" -ForegroundColor Green
        } catch {
            if ($endpoint.ExpectedStatus -and $_.Exception.Response.StatusCode -eq $endpoint.ExpectedStatus) {
                Write-Host "  $($endpoint.Name): Available" -ForegroundColor Green
            } else {
                Write-Host "  $($endpoint.Name): Unavailable" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`n============================================================" -ForegroundColor Cyan
}

# Main execution
try {
    Write-Host "🏥 The Wheel Application Health Monitor" -ForegroundColor Magenta
    
    if ($Continuous) {
        Write-Host "Running continuous health monitoring (Press Ctrl+C to stop)..." -ForegroundColor Yellow
        
        while ($true) {
            Clear-Host
            Write-Host "🏥 The Wheel Application Health Monitor (Continuous Mode)" -ForegroundColor Magenta
            Show-HealthStatus
            
            Write-Host "`n⏳ Next check in 30 seconds..." -ForegroundColor Gray
            Start-Sleep -Seconds 30
        }
    } else {
        Show-HealthStatus
        
        Write-Host "`n💡 Tips:" -ForegroundColor Cyan
        Write-Host "  Use -Continuous for continuous monitoring" -ForegroundColor Gray
        Write-Host "  Use -Detailed for more information" -ForegroundColor Gray
        Write-Host "  Run 'docker-compose logs -f' to view service logs" -ForegroundColor Gray
    }
    
} catch {
    Write-Error "An error occurred during health check: $($_.Exception.Message)"
    exit 1
}

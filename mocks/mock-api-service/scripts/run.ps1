# Main script runner for Mock API Service (PowerShell)

param(
    [string]$Command = ""
)

function Show-Help {
    Write-Host "Mock API Service Script Runner" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\run.ps1 COMMAND" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Green
    Write-Host "  deploy      Deploy the Mock API Service" -ForegroundColor White
    Write-Host "  test        Run API endpoint tests" -ForegroundColor White
    Write-Host "  integration Run integration tests with frontend" -ForegroundColor White
    Write-Host "  build       Build Docker image only" -ForegroundColor White
    Write-Host "  start       Start services using docker-compose" -ForegroundColor White
    Write-Host "  stop        Stop services" -ForegroundColor White
    Write-Host "  logs        View service logs" -ForegroundColor White
    Write-Host "  status      Show service status and health" -ForegroundColor White
    Write-Host "  clean       Clean up Docker resources" -ForegroundColor White
    Write-Host "  help        Show this help message" -ForegroundColor White
}

if ([string]::IsNullOrEmpty($Command) -or $Command -eq "help") {
    Show-Help
    exit 0
}

$cmd = $Command.ToLower()

if ($cmd -eq "deploy") {
    & ".\scripts\deploy.ps1"
} elseif ($cmd -eq "test") {
    & ".\scripts\test-api.ps1"
} elseif ($cmd -eq "integration") {
    & ".\scripts\integration-test.ps1"
} elseif ($cmd -eq "build") {
    & ".\build-docker.ps1"
} elseif ($cmd -eq "start") {
    Write-Host "Starting Mock API Service..." -ForegroundColor Green
    docker-compose up -d
} elseif ($cmd -eq "stop") {
    Write-Host "Stopping Mock API Service..." -ForegroundColor Green
    docker-compose down
} elseif ($cmd -eq "logs") {
    Write-Host "Showing service logs..." -ForegroundColor Green
    docker-compose logs -f mock-api
} elseif ($cmd -eq "status") {
    Write-Host "Service Status:" -ForegroundColor Green
    docker-compose ps
} elseif ($cmd -eq "clean") {
    Write-Host "Cleaning up Docker resources..." -ForegroundColor Green
    docker-compose down
    docker rmi mock-api-service:latest 2>$null
} else {
    Write-Host "Unknown command: $Command" -ForegroundColor Red
    Show-Help
    exit 1
}
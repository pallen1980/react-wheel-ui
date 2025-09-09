# PowerShell script to build the Mock API Service Docker image

Write-Host "Building Mock API Service Docker image..." -ForegroundColor Green

# Build the Docker image
docker build -t mock-api-service:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker image built successfully!" -ForegroundColor Green
    Write-Host "To run the container:" -ForegroundColor Yellow
    Write-Host "docker run -p 3001:3001 mock-api-service:latest" -ForegroundColor Yellow
} else {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}
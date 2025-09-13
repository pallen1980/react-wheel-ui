# Integration Testing Script for Mock API Service with Frontend (PowerShell)

param(
    [string]$ApiBaseUrl = "http://localhost:3001",
    [string]$FrontendUrl = "http://localhost:51235", 
    [string]$FrontendDir = "../..",
    [int]$Timeout = 30,
    [switch]$NoCleanup,
    [switch]$Help
)

function Show-Help {
    Write-Host "Usage: .\integration-test.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -ApiBaseUrl URL      Set API base URL [default: http://localhost:3001]" -ForegroundColor White
    Write-Host "  -FrontendUrl URL     Set frontend URL [default: http://localhost:51235]" -ForegroundColor White
    Write-Host "  -FrontendDir DIR     Set frontend directory [default: ../..] " -ForegroundColor White
    Write-Host "  -Timeout SECONDS     Set startup timeout [default: 30]" -ForegroundColor White
    Write-Host "  -NoCleanup          Don't cleanup services after testing" -ForegroundColor White
    Write-Host "  -Help               Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\integration-test.ps1                     # Run with defaults" -ForegroundColor White
    Write-Host "  .\integration-test.ps1 -NoCleanup         # Keep services running" -ForegroundColor White
    Write-Host "  .\integration-test.ps1 -Timeout 60        # Wait longer for startup" -ForegroundColor White
    exit 0
}

if ($Help) {
    Show-Help
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mock API Integration Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "API Base URL: $ApiBaseUrl" -ForegroundColor Yellow
Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Yellow
Write-Host "Frontend Directory: $FrontendDir" -ForegroundColor Yellow
Write-Host "Timeout: $Timeout seconds" -ForegroundColor Yellow
Write-Host "Cleanup: $(-not $NoCleanup)" -ForegroundColor Yellow
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Green

try {
    $null = Get-Command curl -ErrorAction Stop
    Write-Host "✓ curl available" -ForegroundColor Green
} catch {
    Write-Host "ERROR: curl is not available. Please install curl." -ForegroundColor Red
    exit 1
}

try {
    $null = Get-Command docker -ErrorAction Stop
    Write-Host "✓ Docker available" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker is not available. Please install Docker." -ForegroundColor Red
    exit 1
}

try {
    $null = Get-Command npm -ErrorAction Stop
    Write-Host "✓ npm available" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm is not available. Please install Node.js." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Start Mock API Service
Write-Host "[STEP 1] Starting Mock API Service..." -ForegroundColor Green
try {
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start Mock API Service"
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Wait for API to be ready
Write-Host "Waiting for API to be ready..." -ForegroundColor Yellow
$count = 0
do {
    try {
        $response = Invoke-WebRequest -Uri "$ApiBaseUrl/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Mock API Service is ready" -ForegroundColor Green
            break
        }
    } catch {
        # Continue waiting
    }
    
    $count++
    if ($count -ge $Timeout) {
        Write-Host "ERROR: API service did not start within $Timeout seconds" -ForegroundColor Red
        if (-not $NoCleanup) {
            docker-compose down
        }
        exit 1
    }
    Start-Sleep -Seconds 1
} while ($true)

Write-Host ""

# Step 2: Configure Frontend Environment
Write-Host "[STEP 2] Configuring Frontend Environment..." -ForegroundColor Green

if (-not (Test-Path $FrontendDir)) {
    Write-Host "ERROR: Frontend directory not found: $FrontendDir" -ForegroundColor Red
    if (-not $NoCleanup) {
        docker-compose down
    }
    exit 1
}

# Create or update .env file for frontend
$envContent = "VITE_API_BASE_URL=$ApiBaseUrl"
$envPath = Join-Path $FrontendDir ".env.local"
$envContent | Out-File -FilePath $envPath -Encoding UTF8
Write-Host "✓ Frontend environment configured" -ForegroundColor Green
Write-Host ""

# Step 3: Install Frontend Dependencies (if needed)
Write-Host "[STEP 3] Checking Frontend Dependencies..." -ForegroundColor Green
Push-Location $FrontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
        Pop-Location
        if (-not $NoCleanup) {
            docker-compose down
        }
        exit 1
    }
}
Write-Host "✓ Frontend dependencies ready" -ForegroundColor Green
Pop-Location
Write-Host ""

# Step 4: Start Frontend Development Server
Write-Host "[STEP 4] Starting Frontend Development Server..." -ForegroundColor Green
Push-Location $FrontendDir

# Start frontend in background
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:FrontendDir
    npm run dev
}

Pop-Location

# Wait for frontend to be ready
Write-Host "Waiting for frontend to be ready..." -ForegroundColor Yellow
$count = 0
do {
    try {
        $response = Invoke-WebRequest -Uri $FrontendUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Frontend is ready" -ForegroundColor Green
            break
        }
    } catch {
        # Continue waiting
    }
    
    $count++
    if ($count -ge $Timeout) {
        Write-Host "ERROR: Frontend did not start within $Timeout seconds" -ForegroundColor Red
        Stop-Job $frontendJob -Force
        Remove-Job $frontendJob -Force
        if (-not $NoCleanup) {
            docker-compose down
        }
        exit 1
    }
    Start-Sleep -Seconds 1
} while ($true)

Write-Host ""

# Step 5: Run Integration Tests
Write-Host "[STEP 5] Running Integration Tests..." -ForegroundColor Green
Write-Host ""

# Test API endpoints
Write-Host "Testing API endpoints..." -ForegroundColor Yellow
try {
    & ".\scripts\test-api.ps1" -ApiBaseUrl $ApiBaseUrl -Integration
    if ($LASTEXITCODE -ne 0) {
        throw "API tests failed"
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Stop-Job $frontendJob -Force
    Remove-Job $frontendJob -Force
    if (-not $NoCleanup) {
        docker-compose down
    }
    exit 1
}
Write-Host ""

# Test CORS configuration
Write-Host "Testing CORS configuration..." -ForegroundColor Yellow
try {
    $corsResponse = curl -s -H "Origin: $FrontendUrl" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -X OPTIONS "$ApiBaseUrl/api/auth/login" -w "%{http_code}"
    $corsStatus = $corsResponse[-3..-1] -join ""
    
    if ($corsStatus -eq "200") {
        Write-Host "✓ CORS configuration working" -ForegroundColor Green
    } else {
        Write-Host "✗ CORS configuration failed (Status: $corsStatus)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ CORS test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test authentication flow
Write-Host "Testing authentication flow..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $tempFile = [System.IO.Path]::GetTempFileName()
    $loginBody | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
    
    $authResponse = curl -s -H "Origin: $FrontendUrl" -H "Content-Type: application/json" -d "@$tempFile" "$ApiBaseUrl/api/auth/login" -w "%{http_code}"
    $authStatus = $authResponse[-3..-1] -join ""
    
    Remove-Item $tempFile -Force
    
    if ($authStatus -eq "200") {
        Write-Host "✓ Authentication flow working" -ForegroundColor Green
    } else {
        Write-Host "✗ Authentication flow failed (Status: $authStatus)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Authentication test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Step 6: Manual Testing Instructions
Write-Host "[STEP 6] Manual Testing Instructions..." -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Integration Test Environment Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Yellow
Write-Host "API URL: $ApiBaseUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Manual Test Steps:" -ForegroundColor Green
Write-Host "1. Open browser to $FrontendUrl" -ForegroundColor White
Write-Host "2. Test user login with:" -ForegroundColor White
Write-Host "   Email: test@example.com" -ForegroundColor Gray
Write-Host "   Password: password123" -ForegroundColor Gray
Write-Host "3. Create and save wheel options" -ForegroundColor White
Write-Host "4. Verify options persist after page refresh" -ForegroundColor White
Write-Host "5. Test logout and login again" -ForegroundColor White
Write-Host ""
Write-Host "API Test Endpoints:" -ForegroundColor Green
Write-Host "- Health: $ApiBaseUrl/health" -ForegroundColor White
Write-Host "- Login: $ApiBaseUrl/api/auth/login" -ForegroundColor White
Write-Host "- Options: $ApiBaseUrl/api/users/{userId}/options" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to stop services and cleanup..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
if (-not $NoCleanup) {
    Write-Host ""
    Write-Host "Cleaning up..." -ForegroundColor Green
    
    # Stop frontend
    Stop-Job $frontendJob -Force
    Remove-Job $frontendJob -Force
    
    # Stop API service
    docker-compose down
    
    # Remove temporary environment file
    $envPath = Join-Path $FrontendDir ".env.local"
    if (Test-Path $envPath) {
        Remove-Item $envPath -Force
    }
    
    Write-Host "✓ Cleanup completed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Services left running (--NoCleanup specified)" -ForegroundColor Yellow
    Write-Host "To stop manually:" -ForegroundColor Yellow
    Write-Host "  docker-compose down" -ForegroundColor Gray
    Write-Host "  Stop frontend development server" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Integration Testing Completed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
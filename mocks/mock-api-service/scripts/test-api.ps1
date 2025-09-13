# API Testing Script for Mock API Service (PowerShell)

param(
    [string]$ApiBaseUrl = "http://localhost:3001",
    [switch]$Integration,
    [switch]$Verbose,
    [switch]$Help
)

function Show-Help {
    Write-Host "Usage: .\test-api.ps1 [OPTIONS]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -ApiBaseUrl URL      Set custom API base URL [default: http://localhost:3001]" -ForegroundColor White
    Write-Host "  -Integration         Run integration tests with frontend" -ForegroundColor White
    Write-Host "  -Verbose            Show detailed response output" -ForegroundColor White
    Write-Host "  -Help               Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\test-api.ps1                           # Run basic API tests" -ForegroundColor White
    Write-Host "  .\test-api.ps1 -Integration              # Run with integration tests" -ForegroundColor White
    Write-Host "  .\test-api.ps1 -Verbose                  # Run with detailed output" -ForegroundColor White
    Write-Host "  .\test-api.ps1 -ApiBaseUrl http://localhost:8080  # Test different URL" -ForegroundColor White
    exit 0
}

if ($Help) {
    Show-Help
}

# Configuration
$TestEmail = "test@example.com"
$TestPassword = "password123"
$NewUserEmail = "testuser_$(Get-Random)@example.com"
$AccessToken = ""
$UserId = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mock API Service Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "API Base URL: $ApiBaseUrl" -ForegroundColor Yellow
Write-Host "Run Integration Tests: $Integration" -ForegroundColor Yellow
Write-Host "Verbose Output: $Verbose" -ForegroundColor Yellow
Write-Host ""

# Check if curl is available
try {
    $null = Get-Command curl -ErrorAction Stop
} catch {
    Write-Host "ERROR: curl is not available. Please install curl to run API tests." -ForegroundColor Red
    exit 1
}

function Invoke-ApiTest {
    param(
        [string]$TestName,
        [string]$Method = "GET",
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [string]$Body = "",
        [int[]]$ExpectedStatus = @(200)
    )
    
    Write-Host "[$TestName]" -ForegroundColor Green -NoNewline
    Write-Host " Testing..." -ForegroundColor White
    
    $curlArgs = @("-s", "-w", "%{http_code}")
    
    if ($Method -ne "GET") {
        $curlArgs += "-X", $Method
    }
    
    foreach ($header in $Headers.GetEnumerator()) {
        $curlArgs += "-H", "$($header.Key): $($header.Value)"
    }
    
    if ($Body) {
        $tempFile = [System.IO.Path]::GetTempFileName()
        $Body | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline
        $curlArgs += "-d", "@$tempFile"
    }
    
    $curlArgs += "$ApiBaseUrl$Endpoint"
    
    try {
        $response = & curl @curlArgs
        $statusCode = $response[-3..-1] -join ""
        $responseBody = $response[0..($response.Length-4)] -join "`n"
        
        if ($ExpectedStatus -contains [int]$statusCode) {
            Write-Host "✓ $TestName passed (Status: $statusCode)" -ForegroundColor Green
            if ($Verbose -and $responseBody) {
                Write-Host "Response: $responseBody" -ForegroundColor Gray
            }
            return @{
                Success = $true
                StatusCode = [int]$statusCode
                Body = $responseBody
            }
        } else {
            Write-Host "✗ $TestName failed (Status: $statusCode, Expected: $($ExpectedStatus -join '/'))" -ForegroundColor Red
            if ($Verbose -and $responseBody) {
                Write-Host "Response: $responseBody" -ForegroundColor Gray
            }
            return @{
                Success = $false
                StatusCode = [int]$statusCode
                Body = $responseBody
            }
        }
    } catch {
        Write-Host "✗ $TestName failed with exception: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Success = $false
            StatusCode = 0
            Body = ""
        }
    } finally {
        if ($Body -and (Test-Path $tempFile)) {
            Remove-Item $tempFile -Force
        }
    }
}

# Test 1: Health Check
$result = Invoke-ApiTest -TestName "Health Check" -Endpoint "/health"
Write-Host ""

# Test 2: Login with test user
$loginBody = @{
    email = $TestEmail
    password = $TestPassword
} | ConvertTo-Json

$result = Invoke-ApiTest -TestName "Login with test user" -Method "POST" -Endpoint "/api/auth/login" -Headers @{"Content-Type" = "application/json"} -Body $loginBody

if ($result.Success) {
    try {
        $loginResponse = $result.Body | ConvertFrom-Json
        $AccessToken = $loginResponse.idToken
        $UserId = $loginResponse.localId
        Write-Host "  Extracted User ID: $UserId" -ForegroundColor Gray
    } catch {
        Write-Host "  Warning: Could not parse login response" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Register new user
$registerBody = @{
    email = $NewUserEmail
    password = $TestPassword
    displayName = "Test User"
} | ConvertTo-Json

$result = Invoke-ApiTest -TestName "Register new user" -Method "POST" -Endpoint "/api/auth/register" -Headers @{"Content-Type" = "application/json"} -Body $registerBody
Write-Host ""

# Test 4: Get user options (should return 404 for new user)
if ($AccessToken -and $UserId) {
    $result = Invoke-ApiTest -TestName "Get user options (expecting 404)" -Endpoint "/api/users/$UserId/options" -Headers @{"Authorization" = "Bearer $AccessToken"} -ExpectedStatus @(404)
    Write-Host ""
    
    # Test 5: Save user options
    $optionsBody = @{
        options = @(
            @{ key = "option1"; value = "Option 1"; sequence = 1 },
            @{ key = "option2"; value = "Option 2"; sequence = 2 }
        )
    } | ConvertTo-Json -Depth 3
    
    $result = Invoke-ApiTest -TestName "Save user options" -Method "POST" -Endpoint "/api/users/$UserId/options" -Headers @{"Content-Type" = "application/json"; "Authorization" = "Bearer $AccessToken"} -Body $optionsBody
    Write-Host ""
    
    # Test 6: Get user options (should return saved options)
    $result = Invoke-ApiTest -TestName "Get user options (expecting saved data)" -Endpoint "/api/users/$UserId/options" -Headers @{"Authorization" = "Bearer $AccessToken"}
    Write-Host ""
} else {
    Write-Host "[SKIP] Skipping authenticated tests - login failed" -ForegroundColor Yellow
    Write-Host ""
}

# Test 7: Unauthorized access
$result = Invoke-ApiTest -TestName "Test unauthorized access" -Endpoint "/api/users/test-user/options" -ExpectedStatus @(401)
Write-Host ""

# Integration tests with frontend
if ($Integration) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Running Integration Tests" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Test CORS headers
    $result = Invoke-ApiTest -TestName "CORS preflight" -Method "OPTIONS" -Endpoint "/api/auth/login" -Headers @{
        "Origin" = "http://localhost:51235"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type,Authorization"
    }
    Write-Host ""
    
    # Test with frontend origin
    $result = Invoke-ApiTest -TestName "Frontend origin request" -Method "POST" -Endpoint "/api/auth/login" -Headers @{
        "Origin" = "http://localhost:51235"
        "Content-Type" = "application/json"
    } -Body $loginBody
    Write-Host ""
    
    # Test frontend integration scenario
    Write-Host "[INTEGRATION] Testing complete authentication flow..." -ForegroundColor Green
    Write-Host "This would typically involve:" -ForegroundColor Gray
    Write-Host "  1. Starting the frontend application" -ForegroundColor Gray
    Write-Host "  2. Configuring VITE_API_BASE_URL=$ApiBaseUrl" -ForegroundColor Gray
    Write-Host "  3. Running automated browser tests" -ForegroundColor Gray
    Write-Host "  4. Verifying end-to-end authentication and options flow" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Testing Completed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
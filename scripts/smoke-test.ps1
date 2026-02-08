# RanRHar API Smoke Test
# Tests critical API endpoints (v1 API)

$ErrorActionPreference = "Stop"
$API_URL = "http://localhost:3001"
$API_V1 = "$API_URL/v1"

Write-Host "RanRHar API Smoke Test (v1)" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Use session to persist cookies (httpOnly auth)
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    if ($response.status -eq "ok") {
        Write-Host " PASS" -ForegroundColor Green
    } else {
        Write-Host " FAIL - Unexpected status: $($response.status)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login (Staff) - sets httpOnly cookie
Write-Host "Test 2: Login (staff@test.com)..." -NoNewline
try {
    $loginBody = @{
        email = "staff@test.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_V1/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session

    if ($response.user.email -eq "staff@test.com") {
        Write-Host " PASS" -ForegroundColor Green
    } else {
        Write-Host " FAIL - Invalid response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Token Validation (GET /me) - cookie sent via session
Write-Host "Test 3: Token Validation (GET /me)..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$API_V1/me" -Method Get -WebSession $session

    if ($response.email -eq "staff@test.com") {
        Write-Host " PASS" -ForegroundColor Green
    } else {
        Write-Host " FAIL - Invalid user data" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get Orders (Authenticated)
Write-Host "Test 4: Get Orders (authenticated)..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$API_V1/orders" -Method Get -WebSession $session

    if ($response.orders -ne $null) {
        Write-Host " PASS (Found $($response.orders.Count) orders)" -ForegroundColor Green
    } else {
        Write-Host " FAIL - Expected orders in response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host ""

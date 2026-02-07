# RanRHar API Smoke Test
# Tests critical API endpoints to verify basic functionality

$ErrorActionPreference = "Stop"
$API_URL = "http://localhost:3001"

Write-Host "🧪 RanRHar API Smoke Test" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check..." -NoNewline
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method Get
    if ($response.status -eq "ok") {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL - Unexpected status: $($response.status)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login (Staff)
Write-Host "Test 2: Login (staff@test.com)..." -NoNewline
try {
    $loginBody = @{
        email = "staff@test.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    if ($response.token -and $response.user.email -eq "staff@test.com") {
        $token = $response.token
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL - Invalid response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Token Validation
Write-Host "Test 3: Token Validation (GET /me)..." -NoNewline
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $response = Invoke-RestMethod -Uri "$API_URL/me" -Method Get -Headers $headers
    
    if ($response.email -eq "staff@test.com") {
        Write-Host " ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL - Invalid user data" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Get Orders (Authenticated)
Write-Host "Test 4: Get Orders (authenticated)..." -NoNewline
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $response = Invoke-RestMethod -Uri "$API_URL/orders" -Method Get -Headers $headers
    
    if ($response -is [Array]) {
        Write-Host " ✅ PASS (Found $($response.Count) orders)" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAIL - Expected array response" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host ""

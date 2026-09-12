$ErrorActionPreference = "Stop"

Write-Host "AngelBird Phase 03 mobile setup" -ForegroundColor Cyan

$nodeRaw = (& node -v).Trim().TrimStart('v')
$nodeVersion = [version]$nodeRaw
$minimum = [version]'22.13.0'

if ($nodeVersion -lt $minimum) {
  throw "Expo SDK 57 requires Node.js 22.13.0 or newer. Current: $nodeRaw"
}

$mobile = Join-Path $PSScriptRoot "apps\mobile"
Set-Location $mobile

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created apps/mobile/.env. Update EXPO_PUBLIC_API_BASE_URL before login testing." -ForegroundColor Yellow
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

Write-Host "Aligning Expo SDK dependencies..." -ForegroundColor Cyan
& npx expo install --fix
if ($LASTEXITCODE -ne 0) { throw "expo install --fix failed" }

Write-Host "TypeScript check..." -ForegroundColor Cyan
& npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

Write-Host "Expo Doctor..." -ForegroundColor Cyan
& npx expo-doctor
if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

Write-Host "Phase 03 verification complete." -ForegroundColor Green
Write-Host "Start with: npx expo start --clear"

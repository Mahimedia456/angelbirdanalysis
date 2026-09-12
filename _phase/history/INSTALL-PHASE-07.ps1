$ErrorActionPreference = "Stop"

Write-Host "AngelBird Phase 07 - mobile polish + Expo SDK 57 compatibility" -ForegroundColor Cyan

$nodeRaw = (& node -v).Trim().TrimStart('v')
$nodeVersion = [version]$nodeRaw
$minimum = [version]'22.13.0'
if ($nodeVersion -lt $minimum) { throw "Expo SDK 57 requires Node.js 22.13.0 or newer. Current: $nodeRaw" }

$mobile = Join-Path $PSScriptRoot "apps\mobile"
if (-not (Test-Path $mobile)) { throw "apps/mobile was not found. Extract this ZIP into the AngelBird project root first." }
Set-Location $mobile

Write-Host "Cleaning stale dependency state..." -ForegroundColor Yellow
foreach ($path in @("node_modules", "package-lock.json", ".expo")) {
  if (Test-Path $path) { Remove-Item $path -Recurse -Force }
}

if (Test-Path ".env") { Copy-Item ".env" ".env.pre-phase07.backup" -Force }
Set-Content ".env" "EXPO_PUBLIC_API_BASE_URL=https://angelbirdanalysis-api.vercel.app`r`n"
Write-Host "Production API configured." -ForegroundColor Green

Write-Host "Installing SDK 57 aligned package set..." -ForegroundColor Cyan
& npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

Write-Host "Checking Expo dependency alignment (no automatic version mutation)..." -ForegroundColor Cyan
& npx expo install --check
if ($LASTEXITCODE -ne 0) { throw "Expo dependency alignment failed. Package versions in Phase 07 should already match SDK 57." }

Write-Host "TypeScript 6 check..." -ForegroundColor Cyan
& npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

Write-Host "Expo Doctor..." -ForegroundColor Cyan
& npx expo-doctor
if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

Write-Host ""
Write-Host "Phase 07 verification complete." -ForegroundColor Green
Write-Host "API: https://angelbirdanalysis-api.vercel.app" -ForegroundColor Green
Write-Host "Start: npx expo start --clear" -ForegroundColor White

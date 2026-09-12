$ErrorActionPreference = "Stop"

Write-Host "AngelBird Phase 05 - clean Expo SDK 57 setup" -ForegroundColor Cyan

$nodeRaw = (& node -v).Trim().TrimStart('v')
$nodeVersion = [version]$nodeRaw
$minimum = [version]'22.13.0'

if ($nodeVersion -lt $minimum) {
  throw "Expo SDK 57 requires Node.js 22.13.0 or newer. Current: $nodeRaw"
}

$mobile = Join-Path $PSScriptRoot "apps\mobile"
if (-not (Test-Path $mobile)) {
  throw "apps/mobile was not found. Extract this ZIP into the AngelBird project root first."
}

Set-Location $mobile

Write-Host "Removing stale dependency/cache state to prevent ERESOLVE conflicts..." -ForegroundColor Yellow
foreach ($path in @("node_modules", "package-lock.json", ".expo")) {
  if (Test-Path $path) {
    Remove-Item $path -Recurse -Force
  }
}

if (Test-Path ".env") {
  Copy-Item ".env" ".env.phase04.backup" -Force
}
Set-Content ".env" "EXPO_PUBLIC_API_BASE_URL=https://angelbirdanalysis-api.vercel.app`r`n"
Write-Host "Production AngelBird API configured." -ForegroundColor Green

Write-Host "Verifying npm cache..." -ForegroundColor Cyan
& npm cache verify
if ($LASTEXITCODE -ne 0) { throw "npm cache verify failed" }

Write-Host "Installing pinned Expo SDK 57 dependencies..." -ForegroundColor Cyan
& npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

Write-Host "Checking Expo dependency alignment..." -ForegroundColor Cyan
& npx expo install --check
if ($LASTEXITCODE -ne 0) {
  Write-Host "Expo reported a mismatch. Applying compatible versions..." -ForegroundColor Yellow
  & npx expo install --fix
  if ($LASTEXITCODE -ne 0) { throw "expo install --fix failed" }
}

Write-Host "TypeScript check..." -ForegroundColor Cyan
& npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

Write-Host "Expo Doctor..." -ForegroundColor Cyan
& npx expo-doctor
if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

Write-Host ""
Write-Host "Phase 05 verification complete." -ForegroundColor Green
Write-Host "API: https://angelbirdanalysis-api.vercel.app" -ForegroundColor Green
Write-Host "Ticket + Satisfaction reports are now native live-Sheet screens." -ForegroundColor Green
Write-Host "Start: npx expo start --clear" -ForegroundColor White

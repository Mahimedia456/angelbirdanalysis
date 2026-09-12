$ErrorActionPreference = "Stop"

Write-Host "AngelBird Mobile - Final pre-build corrections" -ForegroundColor Cyan

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

Write-Host "Cleaning stale dependency state..." -ForegroundColor Yellow
foreach ($path in @("node_modules", "package-lock.json", ".expo")) {
  if (Test-Path $path) { Remove-Item $path -Recurse -Force }
}

if (Test-Path ".env") { Copy-Item ".env" ".env.pre-final-prebuild.backup" -Force }
Set-Content ".env" "EXPO_PUBLIC_API_BASE_URL=https://angelbirdanalysis-api.vercel.app`r`n"
Write-Host "Production AngelBird API configured." -ForegroundColor Green

Write-Host "Installing Expo SDK 57 aligned dependencies..." -ForegroundColor Cyan
& npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

# Router peers are direct dependencies in package.json; this command also validates them
# against the installed Expo SDK and corrects only Expo-managed native package versions.
Write-Host "Validating Expo package alignment..." -ForegroundColor Cyan
& npx expo install expo-constants expo-linking
if ($LASTEXITCODE -ne 0) { throw "Required Expo Router peer dependency install failed" }

& npx expo install --check
if ($LASTEXITCODE -ne 0) { throw "Expo dependency alignment failed" }

Write-Host "TypeScript check..." -ForegroundColor Cyan
& npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

Write-Host "Expo public config check..." -ForegroundColor Cyan
& npx expo config --type public *> $null
if ($LASTEXITCODE -ne 0) { throw "Expo config check failed" }

Write-Host "Expo Doctor..." -ForegroundColor Cyan
& npx expo-doctor
if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

Write-Host "Backend route syntax checks..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
foreach ($route in @(
  "backend\src\routes\sheetReportsRoutes.js",
  "backend\src\routes\rmaReportsRoutes.js",
  "backend\src\routes\aiSatisfaction.routes.js"
)) {
  & node --check $route
  if ($LASTEXITCODE -ne 0) { throw "$route syntax check failed" }
}

Write-Host ""
Write-Host "Final pre-build verification complete." -ForegroundColor Green
Write-Host "Mobile version: 0.12.1" -ForegroundColor Green
Write-Host "API: https://angelbirdanalysis-api.vercel.app" -ForegroundColor Green
Write-Host "Next: cd apps\mobile ; npx expo start --clear" -ForegroundColor White
Write-Host "Build/store release work remains stopped until explicitly requested." -ForegroundColor Yellow

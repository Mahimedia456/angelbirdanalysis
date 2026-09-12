$ErrorActionPreference = "Stop"
$mobile = Join-Path $PSScriptRoot "apps\mobile"
if (-not (Test-Path $mobile)) { throw "apps/mobile not found" }
Set-Location $mobile

& npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }
& npx expo config --type public *> $null
if ($LASTEXITCODE -ne 0) { throw "Expo config check failed" }
& npx expo-doctor
if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

Set-Location $PSScriptRoot
foreach ($route in @(
  "backend\src\routes\sheetReportsRoutes.js",
  "backend\src\routes\rmaReportsRoutes.js",
  "backend\src\routes\aiSatisfaction.routes.js"
)) {
  & node --check $route
  if ($LASTEXITCODE -ne 0) { throw "$route syntax check failed" }
}
Write-Host "AngelBird final pre-build verification passed." -ForegroundColor Green

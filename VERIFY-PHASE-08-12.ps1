$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$mobile = Join-Path $root "apps\mobile"
if (-not (Test-Path (Join-Path $mobile "node_modules"))) { throw "Run INSTALL-PHASE-08-12.ps1 first." }

Push-Location $mobile
try {
  & npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }
  & npx expo install --check
  if ($LASTEXITCODE -ne 0) { throw "Expo dependency check failed" }
  & npx expo config --type public *> $null
  if ($LASTEXITCODE -ne 0) { throw "Expo config check failed" }
  & npx expo-doctor
  if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }
} finally {
  Pop-Location
}

& node --check (Join-Path $root "backend\src\routes\sheetReportsRoutes.js")
if ($LASTEXITCODE -ne 0) { throw "Sheet route syntax failed" }
& node --check (Join-Path $root "backend\src\routes\rmaReportsRoutes.js")
if ($LASTEXITCODE -ne 0) { throw "RMA route syntax failed" }
Write-Host "AngelBird Phase 08-12 verification passed." -ForegroundColor Green

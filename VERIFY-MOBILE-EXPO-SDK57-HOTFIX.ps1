$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobile = Join-Path $root "apps\mobile"

if (-not (Test-Path $mobile)) {
  throw "apps\mobile was not found. Merge the latest mobile patch into the AngelBird project root first."
}

Push-Location $mobile
try {
  Write-Host "Running Expo dependency check..." -ForegroundColor Cyan
  npx expo install --check
  if ($LASTEXITCODE -ne 0) {
    throw "Expo dependency alignment failed. Run .\FIX-EXPO-SDK57-DEPS.ps1 from the project root."
  }

  Write-Host "Running TypeScript check..." -ForegroundColor Cyan
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

  Write-Host "Running Expo Doctor..." -ForegroundColor Cyan
  npx expo-doctor
  if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

  Write-Host "AngelBird mobile Expo SDK 57 verification PASSED." -ForegroundColor Green
}
finally {
  Pop-Location
}

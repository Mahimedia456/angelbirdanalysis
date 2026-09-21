$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobile = Join-Path $root "apps\mobile"

if (-not (Test-Path $mobile)) {
  throw "apps\mobile was not found."
}

Push-Location $mobile
try {
  Write-Host "AngelBird Mobile - Expo SDK 57 dependency alignment hotfix" -ForegroundColor Cyan

  Write-Host "Installing current SDK 57 compatible packages..." -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

  Write-Host "Checking Expo dependency alignment..." -ForegroundColor Cyan
  npx expo install --check
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Expo found remaining package drift. Applying Expo's SDK-aware fixer..." -ForegroundColor Yellow
    npx expo install --fix
    if ($LASTEXITCODE -ne 0) { throw "expo install --fix failed" }
  }

  Write-Host "TypeScript check..." -ForegroundColor Cyan
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

  Write-Host "Expo Doctor..." -ForegroundColor Cyan
  npx expo-doctor
  if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

  Write-Host "Expo SDK 57 dependency hotfix PASSED." -ForegroundColor Green
}
finally {
  Pop-Location
}

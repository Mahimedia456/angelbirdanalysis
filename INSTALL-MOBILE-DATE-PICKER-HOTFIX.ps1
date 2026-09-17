$ErrorActionPreference = "Stop"

Write-Host "AngelBird Mobile - Native calendar date filters hotfix" -ForegroundColor Cyan

$mobile = Join-Path $PSScriptRoot "apps\mobile"
if (-not (Test-Path $mobile)) {
  throw "apps/mobile was not found. Extract this ZIP into D:\angelbird-analytics first."
}

Set-Location $mobile

Write-Host "Installing Expo SDK 57 DateTimePicker dependency..." -ForegroundColor Cyan
& npx expo install @expo/ui
if ($LASTEXITCODE -ne 0) { throw "@expo/ui installation failed" }

Write-Host "TypeScript check..." -ForegroundColor Cyan
& npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

Write-Host "Expo Doctor..." -ForegroundColor Cyan
& npx expo-doctor
if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

Write-Host "" 
Write-Host "Date picker hotfix verified." -ForegroundColor Green
Write-Host "Next: cd apps\mobile ; npx expo start --clear" -ForegroundColor White

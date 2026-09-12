$ErrorActionPreference = "Stop"

Write-Host "AngelBird - EAS Android client APK build" -ForegroundColor Cyan

$mobile = Join-Path $PSScriptRoot "apps\mobile"
if (-not (Test-Path $mobile)) {
  throw "apps/mobile was not found. Extract/merge this checkpoint into the AngelBird project root first."
}

Set-Location $mobile

Write-Host "Running pre-build checks..." -ForegroundColor Cyan
& npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

& npx expo-doctor
if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

Write-Host "Checking EAS login..." -ForegroundColor Cyan
& npx eas-cli@latest whoami
if ($LASTEXITCODE -ne 0) {
  Write-Host "EAS login required. Complete the browser/terminal login below." -ForegroundColor Yellow
  & npx eas-cli@latest login
  if ($LASTEXITCODE -ne 0) { throw "EAS login failed" }
}

Write-Host "Checking EAS project link..." -ForegroundColor Cyan
& npx eas-cli@latest project:info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "This local app is not linked to an EAS project yet. EAS will create/link it now." -ForegroundColor Yellow
  & npx eas-cli@latest init
  if ($LASTEXITCODE -ne 0) { throw "EAS project initialization failed" }
}

Write-Host "Starting installable Android APK build..." -ForegroundColor Green
Write-Host "If EAS asks about Android credentials/keystore, choose Generate new credentials for the first build." -ForegroundColor Yellow
& npx eas-cli@latest build --platform android --profile client-apk
if ($LASTEXITCODE -ne 0) { throw "EAS Android APK build failed" }

Write-Host "Build submitted. EAS will print the build page and APK download URL when ready." -ForegroundColor Green

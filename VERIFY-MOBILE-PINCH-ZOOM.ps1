$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobile = Join-Path $root "apps\mobile"

Write-Host "AngelBird mobile pinch zoom verification" -ForegroundColor Cyan
Set-Location $mobile

npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

npx expo-doctor
if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

Write-Host "PASS: pinch zoom mobile hotfix verified" -ForegroundColor Green

param(
  [string]$ProjectRoot = "D:\angelbird-analytics",
  [string]$Profile = "apk"
)

$ErrorActionPreference = "Stop"

$mobile = Join-Path $ProjectRoot "apps\mobile"
if (-not (Test-Path $mobile)) {
  throw "Mobile folder not found: $mobile"
}

Push-Location $mobile
try {
  Write-Host ""
  Write-Host "AngelBird Android APK - EAS Build" -ForegroundColor Cyan
  Write-Host "Mobile: $mobile" -ForegroundColor DarkGray
  Write-Host ""

  Write-Host "[1/7] Installing dependencies..." -ForegroundColor Cyan
  npm install
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

  Write-Host "[2/7] Checking Expo SDK dependency alignment..." -ForegroundColor Cyan
  npx expo install --check
  if ($LASTEXITCODE -ne 0) {
    throw "Expo dependency check failed. Run the SDK 57 dependency hotfix first."
  }

  Write-Host "[3/7] TypeScript..." -ForegroundColor Cyan
  npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

  Write-Host "[4/7] Expo Doctor..." -ForegroundColor Cyan
  npx expo-doctor
  if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }

  Write-Host "[5/7] Checking EAS account..." -ForegroundColor Cyan
  npx eas-cli@latest whoami
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "EAS login is required. Run:" -ForegroundColor Yellow
    Write-Host "  npx eas-cli@latest login" -ForegroundColor White
    throw "EAS account is not logged in."
  }

  Write-Host "[6/7] Ensuring APK build profile in eas.json..." -ForegroundColor Cyan

  $nodePatch = @'
const fs = require("fs");
const path = require("path");
const file = path.join(process.cwd(), "eas.json");
let cfg = {};
if (fs.existsSync(file)) {
  try {
    cfg = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    console.error("Existing eas.json is not valid JSON:", e.message);
    process.exit(2);
  }
}
cfg.build = cfg.build || {};
cfg.build.apk = {
  ...(cfg.build.apk || {}),
  distribution: "internal",
  android: {
    ...((cfg.build.apk && cfg.build.apk.android) || {}),
    buildType: "apk"
  }
};
fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + "\n");
console.log("APK profile ready:", file);
'@

  $nodePatch | node
  if ($LASTEXITCODE -ne 0) { throw "Could not update eas.json" }

  Write-Host ""
  Write-Host "Checking EAS project link..." -ForegroundColor Cyan
  npx eas-cli@latest project:info --non-interactive
  if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "This Expo project is not linked to an EAS project yet." -ForegroundColor Yellow
    Write-Host "Run this ONCE from apps\mobile:" -ForegroundColor Yellow
    Write-Host "  npx eas-cli@latest init" -ForegroundColor White
    Write-Host "Then re-run this build script." -ForegroundColor Yellow
    throw "EAS project link is required before cloud build."
  }

  Write-Host "[7/7] Starting EAS Android APK build..." -ForegroundColor Cyan
  Write-Host "If EAS asks for Android signing credentials and none exist, choose Generate new keystore." -ForegroundColor Yellow
  Write-Host ""

  npx eas-cli@latest build --platform android --profile $Profile --wait
  if ($LASTEXITCODE -ne 0) { throw "EAS Android APK build failed" }

  Write-Host ""
  Write-Host "BUILD FINISHED." -ForegroundColor Green
  Write-Host "The EAS output above contains the APK build URL." -ForegroundColor Green
  Write-Host ""
  Write-Host "To download/select the Android build with EAS CLI:" -ForegroundColor Cyan
  Write-Host "  npx eas-cli@latest build:download -p android" -ForegroundColor White
}
finally {
  Pop-Location
}

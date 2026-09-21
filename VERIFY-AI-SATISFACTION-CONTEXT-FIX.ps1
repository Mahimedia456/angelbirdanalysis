$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$service = Join-Path $root "backend\src\services\aiSatisfaction.service.js"

if (-not (Test-Path $service)) {
  throw "AI satisfaction service not found: $service"
}

Write-Host "[1/3] Node syntax check..." -ForegroundColor Cyan
node --check $service
if ($LASTEXITCODE -ne 0) { throw "AI service syntax check failed" }

Write-Host "[2/3] Context-combination contract..." -ForegroundColor Cyan
$content = Get-Content $service -Raw

$required = @(
  "Use EVERY available text source",
  "communication/status mismatch",
  "The summary MUST reflect all available text sources",
  "The recommended action MUST be consistent",
  "at least one short evidence item from EACH available text source",
  "[NOT PROVIDED]",
  "maxItems: 8"
)

foreach ($needle in $required) {
  if (-not $content.Contains($needle)) {
    throw "Missing AI context rule: $needle"
  }
}

Write-Host "[3/3] Ticket 5673 regression contract..." -ForegroundColor Cyan
if (-not $content.Contains("Forwarded to sales/marketing and submitted as solved")) {
  throw "Ticket 5673 regression example is missing."
}

Write-Host "PASS: AI Satisfaction now enforces combined customer/internal/external context." -ForegroundColor Green

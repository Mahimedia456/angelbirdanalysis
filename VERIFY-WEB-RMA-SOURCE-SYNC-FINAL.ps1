$ErrorActionPreference = "Stop"

Write-Host "AngelBird Web - RMA source sync + heatmap verification" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Require-File([string]$Path) {
    if (-not (Test-Path $Path)) {
        throw "Missing required file: $Path"
    }
}

function Require-Text([string]$Path, [string]$Text) {
    Require-File $Path
    $content = Get-Content $Path -Raw
    if (-not $content.Contains($Text)) {
        throw "Expected text not found in ${Path}: $Text"
    }
}

Require-Text "backend\src\services\rmaSheetService.js" 'const RMA_TAB = process.env.GOOGLE_SHEET_RMA_TAB || "RMA"'
Require-Text "backend\src\services\rmaSheetService.js" 'Never fall back to Ticket'
Require-Text "backend\src\services\rmaAnalyticsService.js" 'One RMA record per Ticket #'
Require-Text "src\components\rma\RmaFilters.jsx" 'const rmaTypes = uniqueOptions(rows.map((row) => row.rmaType))'
Require-Text "src\components\rma\RmaMonthlyInsights.jsx" 'function IssueHeatmap'
Require-Text "src\components\rma\RmaMonthlyInsights.jsx" 'Trending Issues by Month'
Require-Text "src\pages\ReportsPage.jsx" 'Ticket Support Category is a second valid source'

Write-Host "Static feature checks passed." -ForegroundColor Green

node --check "backend/src/services/rmaAnalyticsService.js"
if ($LASTEXITCODE -ne 0) { throw "rmaAnalyticsService syntax check failed" }

node --check "backend/src/services/rmaSheetService.js"
if ($LASTEXITCODE -ne 0) { throw "rmaSheetService syntax check failed" }

node --check "backend/src/services/googleSheetsService.js"
if ($LASTEXITCODE -ne 0) { throw "googleSheetsService syntax check failed" }

Write-Host "Backend syntax checks passed." -ForegroundColor Green

$smoke = @'
import { buildRmaAnalytics, deduplicateRmaRows, normalizeRmaRows } from "./backend/src/services/rmaAnalyticsService.js";

const types = [
  "RMA",
  "Data Recovery RMA",
  "Broken Plastic",
  "Repair & Replaced",
  "Date Recovery",
  "Faulty",
  "Warranty Replacement",
  "Custom Type A",
  "Custom Type B"
];

const raw = types.map((type, index) => ({
  sheet_row_number: index + 2,
  ticket_number: String(7000 + index),
  region: "EMEA",
  date: `2026-09-${String(index + 1).padStart(2, "0")}`,
  product_1: "Test Product",
  ticket_subject: "Test",
  rma_type: type,
  issues: "Test Issue"
}));

raw.push({
  sheet_row_number: 20,
  ticket_number: "7000",
  region: "EMEA",
  date: "2026-09-20",
  product_1: "Test Product",
  ticket_subject: "Updated duplicate",
  rma_type: "RMA",
  issues: "Updated Issue"
});

const normalized = normalizeRmaRows(raw);
const unique = deduplicateRmaRows(normalized);
const analytics = buildRmaAnalytics(unique);

if (unique.length !== 9) {
  throw new Error(`Expected 9 unique Ticket # records, got ${unique.length}`);
}

if (analytics.byRmaType.length !== 9) {
  throw new Error(`Expected 9 dynamic RMA TYPE categories, got ${analytics.byRmaType.length}`);
}

console.log("RMA smoke test passed: duplicate Ticket # collapsed while 9 unique RMA TYPE categories remain visible.");
'@

$smoke | node --input-type=module -
if ($LASTEXITCODE -ne 0) { throw "RMA source smoke test failed" }

if (Test-Path "package.json") {
    Write-Host "Running production web build..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Web production build failed" }
}

Write-Host "AngelBird RMA source sync verification PASSED." -ForegroundColor Green

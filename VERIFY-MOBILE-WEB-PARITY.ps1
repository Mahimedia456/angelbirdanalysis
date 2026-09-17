$ErrorActionPreference = "Stop"

Write-Host "AngelBird Mobile - Web parity verification" -ForegroundColor Cyan

$root = $PSScriptRoot
$mobile = Join-Path $root "apps\mobile"
if (-not (Test-Path $mobile)) { throw "apps/mobile not found" }

$required = @(
  "src\tickets\TicketReportScreen.tsx",
  "src\tickets\ticketAnalytics.ts",
  "src\satisfaction\SatisfactionReportScreen.tsx",
  "src\satisfaction\satisfactionAnalytics.ts",
  "src\rma\RmaReportScreen.tsx",
  "src\rma\rmaAnalytics.ts",
  "src\components\ReportCharts.tsx"
)
foreach ($file in $required) {
  if (-not (Test-Path (Join-Path $mobile $file))) { throw "Missing $file" }
}

$ticket = Get-Content (Join-Path $mobile "src\tickets\TicketReportScreen.tsx") -Raw
$satisfaction = Get-Content (Join-Path $mobile "src\satisfaction\SatisfactionReportScreen.tsx") -Raw
$rma = Get-Content (Join-Path $mobile "src\rma\RmaReportScreen.tsx") -Raw
$charts = Get-Content (Join-Path $mobile "src\components\ReportCharts.tsx") -Raw
$ticketAnalytics = Get-Content (Join-Path $mobile "src\tickets\ticketAnalytics.ts") -Raw

function MustContain($text, $pattern, $label) {
  if ($text -notmatch $pattern) { throw "Missing expected behavior: $label" }
}
function MustNotContain($text, $pattern, $label) {
  if ($text -match $pattern) { throw "Unexpected legacy behavior remains: $label" }
}

MustNotContain $ticket 'TSE|Product 2|Ticket Procedure|Procedure' 'Ticket TSE/Product2/Procedure UI'
MustNotContain $rma 'TSE|Product 2|Month-wise RMA|RMA Team' 'RMA TSE/Product2/month/team UI'
MustNotContain ($ticket + $satisfaction + $rma) 'Google Sheet|Google Sheet Live' 'data-source labels'
MustContain $ticket 'Ticket by Region' 'Ticket region chart'
MustContain $ticket 'VerticalBarChart title="Ticket Support Category"' 'Ticket support-category vertical bar'
MustContain $ticket 'LineTrendChart title="Ticket Product Category"' 'Ticket product-category line'
MustContain $ticket 'VerticalBarChart title="Products by Ticket Count"' 'Ticket product vertical bar'
MustContain $ticketAnalytics "raw === 'NA'.*return 'UAE'|raw === 'NA' \|\| raw === 'NORTH AMERICA'" 'NA -> UAE normalization'
MustContain $ticketAnalytics "data recovery rma" 'Data Recovery RMA KPI mapping'
MustContain $satisfaction "\['Good', 'Bad', 'All'\]" 'Good/Bad/All record selector'
MustContain $satisfaction 'With Comments vs Without Comments' 'comment coverage chart'
MustNotContain $satisfaction 'Solved Status|Not Solved|Solved tickets' 'solved UI'
MustContain $rma 'HorizontalBarChart title="RMA by Region"' 'RMA region horizontal chart'
MustContain $rma 'VerticalBarChart title="RMA Type"' 'RMA type vertical chart'
MustContain $rma 'LineTrendChart title="Date-wise RMA"' 'RMA date line chart'
MustContain $rma 'VerticalBarChart title="Products by RMA"' 'RMA product vertical chart'
MustContain $charts 'onHoverIn' 'pointer hover handling'
MustContain $charts 'onPressIn' 'native touch marker handling'
MustContain $charts 'pointHit' 'line marker hit targets'
MustContain $charts 'VerticalBarChart' 'vertical bar chart component'

Set-Location $mobile
Write-Host "Static parity checks passed." -ForegroundColor Green

if (Test-Path "node_modules") {
  Write-Host "Running TypeScript..." -ForegroundColor Cyan
  & npm run typecheck
  if ($LASTEXITCODE -ne 0) { throw "TypeScript check failed" }

  Write-Host "Running Expo Doctor..." -ForegroundColor Cyan
  & npx expo-doctor
  if ($LASTEXITCODE -ne 0) { throw "Expo Doctor failed" }
} else {
  Write-Host "node_modules is not installed; static parity checks passed. Run INSTALL-FINAL-PREBUILD.ps1 for full checks." -ForegroundColor Yellow
}

Write-Host "AngelBird mobile web parity verification complete." -ForegroundColor Green

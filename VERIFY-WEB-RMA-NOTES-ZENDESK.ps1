$ErrorActionPreference = "Stop"

Write-Host "AngelBird Web - RMA trends, Satisfaction notes and Zendesk link verification" -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$required = @(
  "src\components\rma\RmaMonthlyInsights.jsx",
  "src\components\satisfaction\SatisfactionReportTable.jsx",
  "src\components\common\ZendeskTicketLink.jsx",
  "src\utils\zendesk.js",
  "backend\src\services\googleSheetsService.js",
  "backend\src\routes\sheetReportsRoutes.js",
  "backend\src\services\aiSatisfaction.service.js"
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    throw "Missing required file: $file"
  }
}

$monthly = Get-Content "src\components\rma\RmaMonthlyInsights.jsx" -Raw
if ($monthly -notmatch "Monthly RMA Overview") { throw "Monthly RMA Overview chart missing." }
if ($monthly -notmatch "Trending Issues by Month") { throw "Trending Issues chart missing." }

$notes = Get-Content "src\components\satisfaction\SatisfactionReportTable.jsx" -Raw
if ($notes -notmatch "Internal Note") { throw "Internal Note UI missing." }
if ($notes -notmatch "External Team Note") { throw "External Team Note UI missing." }
if ($notes -notmatch "updateSatisfactionNotes") { throw "Satisfaction note save action missing." }

$zendesk = Get-Content "src\utils\zendesk.js" -Raw
if ($zendesk -notmatch "angelbirds\.zendesk\.com/agent/tickets") { throw "Zendesk ticket URL parser missing." }

$routeText = Get-Content "backend\src\routes\sheetReportsRoutes.js" -Raw
if ($routeText -notmatch '"/satisfaction/notes"') { throw "Satisfaction note API route missing." }

$aiText = Get-Content "backend\src\services\aiSatisfaction.service.js" -Raw
if ($aiText -notmatch "Internal team note") { throw "Internal Note AI context missing." }
if ($aiText -notmatch "External team note") { throw "External Team Note AI context missing." }

Write-Host "Checking backend JavaScript syntax..." -ForegroundColor Yellow
node --check backend\src\services\googleSheetsService.js
node --check backend\src\controllers\sheetReportsController.js
node --check backend\src\routes\sheetReportsRoutes.js
node --check backend\src\controllers\aiSatisfaction.controller.js
node --check backend\src\services\aiSatisfaction.service.js
node --check backend\src\services\rmaAnalyticsService.js

if ($LASTEXITCODE -ne 0) {
  throw "Backend syntax check failed."
}

Write-Host "Building web frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
  throw "Web frontend build failed."
}

Write-Host "PASS: AngelBird web RMA trends + notes + Zendesk update verified." -ForegroundColor Green
Write-Host "Reminder: note editing requires GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY and Sheet Editor sharing." -ForegroundColor DarkYellow

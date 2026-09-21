$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$file = Join-Path $root "src\components\rma\RmaMonthlyInsights.jsx"

if (-not (Test-Path $file)) {
  throw "RmaMonthlyInsights.jsx not found."
}

$content = Get-Content $file -Raw

$required = @(
  '"Broken Plastic": "#F97316"',
  '"Repair & Replaced": "#8B5CF6"',
  '"Data Recovery RMA": "#0F172A"',
  '"Date Recovery": "#2563EB"',
  'fill={getRmaCategoryColor(item.label, index, colors)}'
)

foreach ($item in $required) {
  if (-not $content.Contains($item)) {
    throw "Missing expected color rule: $item"
  }
}

Write-Host "PASS: RMA monthly category colors are stable and distinct." -ForegroundColor Green

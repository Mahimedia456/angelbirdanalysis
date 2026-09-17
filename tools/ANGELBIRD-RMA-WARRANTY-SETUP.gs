/**
 * Optional one-time RMA Sheet helper.
 * Paste this function into the SAME Apps Script project connected to the
 * AngelBird reporting Sheet, then run setupAngelBirdRmaColumns once.
 * It only ensures the two reporting columns exist; it does not change data.
 */
function setupAngelBirdRmaColumns() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Open the AngelBird reporting Sheet first, then run this function again.');
  }

  const rmaSheet = spreadsheet.getSheetByName('RMA');

  if (!rmaSheet) {
    throw new Error('RMA tab not found. Rename the tab to RMA or update the tab name in this function.');
  }

  ensureAngelBirdRmaColumn(rmaSheet, 'Issues');
  ensureAngelBirdRmaColumn(rmaSheet, 'Warranty Status');

  Logger.log('RMA columns ready: Issues, Warranty Status');
}

function ensureAngelBirdRmaColumn(sheet, columnName) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map((value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' '));

  const normalizedName = String(columnName || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  if (!headers.includes(normalizedName)) {
    sheet.getRange(1, lastColumn + 1).setValue(columnName);
  }
}

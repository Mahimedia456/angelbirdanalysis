const TAB_NAME = 'Satisfaction';
const RMA_TAB_NAME = 'RMA';
const WRITER_VERSION = '2.1.0';

/*
 * Run this ONCE from the Apps Script editor while this script is opened
 * from the AngelBird Google Sheet (Extensions -> Apps Script).
 *
 * 1) Replace CHANGE_THIS... with your own long random secret.
 * 2) Select setupAngelBirdConfig in the function dropdown.
 * 3) Click Run and approve Google authorization.
 * 4) Deploy as Web app: Execute as Me / Who has access: Anyone.
 * 5) Copy the deployment URL ending in /exec.
 */
function setupAngelBirdConfig() {
  const token = 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET';
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error(
      'Open the reporting Google Sheet first, then use Extensions -> Apps Script and run setupAngelBirdConfig again.'
    );
  }

  if (!token || token === 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET') {
    throw new Error('Replace CHANGE_THIS_TO_A_LONG_RANDOM_SECRET before running setupAngelBirdConfig.');
  }

  PropertiesService.getScriptProperties().setProperties({
    ANGELBIRD_API_TOKEN: token,
    ANGELBIRD_SPREADSHEET_ID: spreadsheet.getId(),
  });

  const satisfactionSheet = spreadsheet.getSheetByName(TAB_NAME);
  if (satisfactionSheet) {
    ensureColumn(satisfactionSheet, 'Internal Note');
    ensureColumn(satisfactionSheet, 'External Team Note');
  }

  const rmaSheet = spreadsheet.getSheetByName(RMA_TAB_NAME);
  if (rmaSheet) {
    ensureColumn(rmaSheet, 'Issues');
    ensureColumn(rmaSheet, 'Warranty Status');
  }

  Logger.log('AngelBird writer configured for spreadsheet: ' + spreadsheet.getId());
}

function doGet() {
  const props = PropertiesService.getScriptProperties();

  return jsonResponse({
    ok: true,
    service: 'AngelBird Satisfaction Notes API',
    version: WRITER_VERSION,
    configured: Boolean(
      props.getProperty('ANGELBIRD_API_TOKEN') &&
      props.getProperty('ANGELBIRD_SPREADSHEET_ID')
    ),
    tab: TAB_NAME,
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(20000);

    const body = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '{}');
    const props = PropertiesService.getScriptProperties();
    const savedToken = props.getProperty('ANGELBIRD_API_TOKEN');
    const spreadsheetId = props.getProperty('ANGELBIRD_SPREADSHEET_ID');

    if (!savedToken || !spreadsheetId) {
      return jsonResponse({
        ok: false,
        error: 'Apps Script is not configured. Run setupAngelBirdConfig once from the Apps Script editor.',
      });
    }

    if (body.token !== savedToken) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }

    if (String(body.action || '') !== 'updateNotes') {
      return jsonResponse({ ok: false, error: 'Unsupported action' });
    }

    const ticketId = extractTicketId(body.ticketId);

    if (!ticketId) {
      return jsonResponse({ ok: false, error: 'ticketId is required' });
    }

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(TAB_NAME);

    if (!sheet) {
      return jsonResponse({
        ok: false,
        error: 'Sheet tab "' + TAB_NAME + '" not found. Update TAB_NAME in Apps Script if your tab has another name.',
      });
    }

    ensureColumn(sheet, 'Internal Note');
    ensureColumn(sheet, 'External Team Note');

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (lastRow < 2) {
      return jsonResponse({ ok: false, error: 'No satisfaction ticket rows found' });
    }

    const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
    const headers = values[0].map(normalizeHeader);

    const ticketColumn = findColumn(headers, [
      'ticket id',
      'ticket #',
      'ticket number',
      'ticketid',
    ]);

    const internalColumn = findColumn(headers, ['internal note']);
    const externalColumn = findColumn(headers, [
      'external team note',
      'external note',
    ]);

    if (ticketColumn === -1) {
      return jsonResponse({ ok: false, error: 'Ticket ID column not found' });
    }

    let matchedRow = -1;

    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      if (extractTicketId(values[rowIndex][ticketColumn]) === ticketId) {
        matchedRow = rowIndex + 1;
        break;
      }
    }

    if (matchedRow === -1) {
      return jsonResponse({ ok: false, error: 'Ticket ' + ticketId + ' not found' });
    }

    if (Object.prototype.hasOwnProperty.call(body, 'internalNote')) {
      sheet
        .getRange(matchedRow, internalColumn + 1)
        .setValue(String(body.internalNote || '').trim());
    }

    if (Object.prototype.hasOwnProperty.call(body, 'externalTeamNote')) {
      sheet
        .getRange(matchedRow, externalColumn + 1)
        .setValue(String(body.externalTeamNote || '').trim());
    }

    SpreadsheetApp.flush();

    return jsonResponse({
      ok: true,
      version: WRITER_VERSION,
      ticketId: ticketId,
      row: matchedRow,
      internalNote: Object.prototype.hasOwnProperty.call(body, 'internalNote')
        ? String(body.internalNote || '').trim()
        : undefined,
      externalTeamNote: Object.prototype.hasOwnProperty.call(body, 'externalTeamNote')
        ? String(body.externalTeamNote || '').trim()
        : undefined,
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {
      // Ignore release errors when lock acquisition failed.
    }
  }
}

function ensureColumn(sheet, columnName) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getDisplayValues()[0]
    .map(normalizeHeader);

  if (!headers.includes(normalizeHeader(columnName))) {
    sheet.getRange(1, lastCol + 1).setValue(columnName);
  }
}

function findColumn(headers, aliases) {
  const normalizedAliases = aliases.map(normalizeHeader);
  return headers.findIndex((header) => normalizedAliases.includes(header));
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function extractTicketId(value) {
  const text = String(value || '').trim();

  if (/^\d+$/.test(text)) return text;

  const urlMatch = text.match(/\/tickets\/(\d+)/i);
  if (urlMatch) return urlMatch[1];

  const numberMatch = text.match(/\d+/);
  return numberMatch ? numberMatch[0] : '';
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

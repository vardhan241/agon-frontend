// ============================================================
// GOOGLE APPS SCRIPT CODE
// Deploy this as a Web App in Google Apps Script
// ============================================================
//
// SETUP:
// 1. Create a Google Sheet with columns: car_number, bay_number, created_at, updated_at
// 2. Open Apps Script from the Sheet (Extensions > Apps Script)
// 3. Paste this code
// 4. Deploy > New deployment > Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the Web App URL and paste it in src/lib/api.ts BASE_URL
//
// SHEETS: "Vehicles" (main) and "vehicle_history" (log)
// ============================================================

const SHEET_NAME = 'Vehicles';
const HISTORY_SHEET = 'vehicle_history';
const TOTAL_BAYS = 32;

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['car_number', 'bay_number', 'created_at', 'updated_at']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  return sheet;
}

function getHistorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(HISTORY_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(HISTORY_SHEET);
    sheet.appendRow(['car_number', 'old_bay', 'new_bay', 'timestamp', 'action']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  return sheet;
}

function logHistory(carNumber, oldBay, newBay, action) {
  const sheet = getHistorySheet();
  const now = new Date().toISOString();
  sheet.appendRow([carNumber, oldBay || '', newBay || '', now, action]);
}

function doGet(e) {
  const params = e.parameter;
  const action = (params.action || '').toLowerCase();
  const carNumber = (params.car_number || '').trim().toUpperCase();
  const bayNumber = (params.bay_number || '').trim().toUpperCase();

  try {
    if (action === 'list') return handleList();
    if (action === 'delete' && carNumber) return handleDelete(carNumber);
    if (action === 'stats') return handleStats();
    if (action === 'history') return handleHistory();
    if (action === 'clear') return handleClear();
    if (action === 'bay_lookup' && bayNumber) return handleBayLookup(bayNumber);
    if (carNumber && bayNumber) return handleSave(carNumber, bayNumber);
    if (carNumber) return handleFind(carNumber);
    return jsonResponse({ error: 'Invalid parameters' });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function handleFind(carNumber) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().toUpperCase() === carNumber) {
      return jsonResponse({
        found: true,
        car_number: data[i][0],
        bay_number: data[i][1],
        created_at: data[i][2],
        updated_at: data[i][3] || null
      });
    }
  }
  return jsonResponse({ found: false });
}

function handleBayLookup(bayNumber) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString().toUpperCase() === bayNumber) {
      return jsonResponse({
        found: true,
        car_number: data[i][0],
        bay_number: data[i][1],
        created_at: data[i][2],
        updated_at: data[i][3] || null
      });
    }
  }
  return jsonResponse({ found: false });
}

function handleSave(carNumber, bayNumber) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().toUpperCase() === carNumber) {
      const oldBay = data[i][1].toString();
      const row = i + 1;
      sheet.getRange(row, 2).setValue(bayNumber);
      sheet.getRange(row, 4).setValue(now);
      logHistory(carNumber, oldBay, bayNumber, 'UPDATED');
      return jsonResponse({ success: true, action: 'updated' });
    }
  }

  sheet.appendRow([carNumber, bayNumber, now, '']);
  logHistory(carNumber, '', bayNumber, 'CREATED');
  return jsonResponse({ success: true, action: 'created' });
}

function handleList() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const vehicles = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      vehicles.push({
        car_number: data[i][0],
        bay_number: data[i][1],
        created_at: data[i][2],
        updated_at: data[i][3] || null
      });
    }
  }
  vehicles.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
  return jsonResponse({ success: true, vehicles });
}

function handleDelete(carNumber) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().toUpperCase() === carNumber) {
      const oldBay = data[i][1].toString();
      sheet.deleteRow(i + 1);
      logHistory(carNumber, oldBay, '', 'DELETED');
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ success: true });
}

function handleStats() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  let totalVehicles = 0;
  let todayEntries = 0;
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      totalVehicles++;
      const ts = new Date(data[i][3] || data[i][2]).getTime();
      if (ts >= startOfDay) todayEntries++;
    }
  }

  return jsonResponse({
    success: true,
    total_vehicles: totalVehicles,
    today_entries: todayEntries,
    free_bays: TOTAL_BAYS - totalVehicles,
    total_bays: TOTAL_BAYS
  });
}

function handleHistory() {
  const sheet = getHistorySheet();
  const data = sheet.getDataRange().getValues();
  const history = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      history.push({
        car_number: data[i][0],
        old_bay: data[i][1] || '',
        new_bay: data[i][2] || '',
        timestamp: data[i][3],
        action: data[i][4]
      });
    }
  }
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return jsonResponse({ success: true, history });
}

function handleClear() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  // Log all deletions
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      logHistory(data[i][0], data[i][1], '', 'DELETED');
    }
  }
  // Delete all rows except header
  if (data.length > 1) {
    sheet.deleteRows(2, data.length - 1);
  }
  return jsonResponse({ success: true });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

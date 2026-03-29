/**
 * HYROX ENGINE — Apps Script (Coach + Cloud Storage)
 *
 * This script handles:
 *   1. AI Coach proxy (GET ?action=coach&payload=... → Anthropic API)
 *   2. Cloud storage (GET ?action=set/getAll for cross-device sync)
 *
 * NOTE: Everything uses doGet because Apps Script's doPost is unreachable
 * from browser fetch — the 302 redirect converts POST→GET and drops the body.
 *
 * Deploy as: Web App → Execute as: Me → Access: Anyone
 */

// ============================================
// CONFIGURATION
// ============================================
const ANTHROPIC_API_KEY = 'YOUR_KEY_HERE';  // ← Paste your Anthropic API key
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const APPDATA_SHEET = 'AppData';

// ============================================
// doGet — All requests route through here
// ============================================
//   ?action=coach&payload={...}          → proxy to Anthropic API
//   ?action=set&key=zones&payload={...}  → save a key
//   ?action=getAll                       → return all stored keys
//   (no params)                          → health check
function doGet(e) {
  const params = e?.parameter || {};
  const action = params.action;

  try {
    if (action === 'coach') {
      return handleCoach(params.payload);
    }

    if (action === 'set') {
      return handleStorageSet(params.key, params.payload);
    }

    if (action === 'getAll') {
      return handleStorageGetAll();
    }

    // Health check
    return jsonResponse({ status: 'ok', message: 'HYROX ENGINE endpoint v5 running', timestamp: new Date().toISOString() });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// Keep doPost as a fallback — won't be called from browser but useful for testing
function doPost(e) {
  // Try to parse body and treat as coach request
  try {
    let body = null;
    if (e?.postData?.contents) {
      body = JSON.parse(e.postData.contents);
    }
    if (body && body.messages) {
      return handleCoach(JSON.stringify(body));
    }
    return jsonResponse({ status: 'error', message: 'Use GET with ?action=coach&payload=...' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'doPost error: ' + err.message });
  }
}

// ============================================
// AI COACH — Proxy to Anthropic API
// ============================================
function handleCoach(payloadStr) {
  if (!payloadStr) {
    return jsonResponse({ status: 'error', message: 'Missing payload parameter' });
  }

  let body;
  try {
    body = JSON.parse(payloadStr);
  } catch (err) {
    return jsonResponse({ status: 'error', message: 'Invalid JSON in payload: ' + err.message });
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return jsonResponse({ status: 'error', message: 'Missing messages array in payload' });
  }

  // Build Anthropic API request
  const apiBody = {
    model: body.model || 'claude-sonnet-4-6',
    max_tokens: body.max_tokens || 1000,
    messages: body.messages
  };
  if (body.system) {
    apiBody.system = body.system;
  }

  const response = UrlFetchApp.fetch(ANTHROPIC_URL, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(apiBody),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode !== 200) {
    return jsonResponse({
      status: 'error',
      message: 'Anthropic API error: ' + statusCode,
      detail: responseText.substring(0, 500)
    });
  }

  // Return Anthropic response directly — frontend expects { content: [{ text: "..." }] }
  return ContentService.createTextOutput(responseText)
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// CLOUD STORAGE — AppData sheet
// ============================================
function handleStorageSet(key, payload) {
  if (!key) return jsonResponse({ status: 'error', message: 'Missing key' });

  const sheet = getOrCreateAppDataSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(payload || '');
      return jsonResponse({ status: 'ok', action: 'updated', key: key });
    }
  }

  sheet.appendRow([key, payload || '']);
  return jsonResponse({ status: 'ok', action: 'created', key: key });
}

function handleStorageGetAll() {
  const sheet = getOrCreateAppDataSheet();
  const data = sheet.getDataRange().getValues();
  const result = {};

  for (let i = 0; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];
    if (key && key !== 'key') {
      result[key] = value || '';
    }
  }

  return jsonResponse(result);
}

function getOrCreateAppDataSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(APPDATA_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(APPDATA_SHEET);
    sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  return sheet;
}

// ============================================
// HELPERS
// ============================================
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HYROX ENGINE — Apps Script (Coach + Cloud Storage)
 *
 * This script handles:
 *   1. AI Coach proxy (POST → Anthropic API)
 *   2. Cloud storage (GET ?action=set/getAll for cross-device sync)
 *
 * Deploy as: Web App → Execute as: Me → Access: Anyone
 *
 * IMPORTANT: After pasting, set your Anthropic API key below.
 * Then: Deploy → New Deployment → Web App → Deploy
 * Copy the new URL into APPS_SCRIPT_URL in index.html if it changed.
 */

// ============================================
// CONFIGURATION
// ============================================
const ANTHROPIC_API_KEY = 'YOUR_KEY_HERE';  // ← Paste your Anthropic API key
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const APPDATA_SHEET = 'AppData';

// ============================================
// doGet — Cloud Storage (read/write via GET)
// ============================================
// The frontend uses GET for storage to avoid Apps Script's POST redirect issues.
//   ?action=set&key=zones&payload={...}  → save a key
//   ?action=getAll                       → return all stored keys
//   (no params)                          → health check
function doGet(e) {
  const params = e?.parameter || {};
  const action = params.action;

  try {
    if (action === 'set') {
      return handleStorageSet(params.key, params.payload);
    }

    if (action === 'getAll') {
      return handleStorageGetAll();
    }

    // Health check
    return jsonResponse({ status: 'ok', message: 'HYROX ENGINE endpoint running', timestamp: new Date().toISOString() });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ============================================
// doPost — AI Coach Proxy
// ============================================
// The frontend sends:
//   POST with Content-Type: application/json
//   Body: { model, max_tokens, system, messages }
//
// Apps Script issue: POST to a web app triggers a 302 redirect.
// When the browser follows the redirect, the body can arrive as:
//   (a) e.postData.contents — original JSON string (ideal)
//   (b) e.parameter.payload — if frontend sends as URL param fallback
//   (c) form-encoded in e.parameter — if redirect strips Content-Type
//
// This handler tries all three.
function doPost(e) {
  try {
    let body = null;

    // Method 1: Standard JSON POST body
    if (e?.postData?.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        // postData exists but isn't valid JSON — might be form-encoded
        // Try to extract from form parameter
      }
    }

    // Method 2: Payload sent as URL parameter (fallback from frontend)
    if (!body && e?.parameter?.payload) {
      try {
        body = JSON.parse(e.parameter.payload);
      } catch (parseErr) {}
    }

    // Method 3: Form-encoded — the JSON got URL-encoded as a form key
    // When redirect strips Content-Type, the entire JSON body becomes a form key
    if (!body && e?.parameter) {
      const keys = Object.keys(e.parameter);
      // The JSON body often arrives as a single form key (the whole JSON string)
      for (const key of keys) {
        if (key.startsWith('{') && key.includes('model')) {
          try {
            body = JSON.parse(key);
            break;
          } catch (parseErr) {}
        }
      }
    }

    if (!body) {
      return jsonResponse({
        status: 'error',
        message: 'No valid request body found. Received postData type: ' + (e?.postData?.type || 'none')
      });
    }

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return jsonResponse({ status: 'error', message: 'Missing messages array' });
    }

    // Forward to Anthropic API
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

    // Return the Anthropic response directly to the frontend
    // The frontend expects: { content: [{ text: "..." }] }
    return ContentService.createTextOutput(responseText)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'Coach proxy error: ' + err.message
    });
  }
}

// ============================================
// CLOUD STORAGE — AppData sheet
// ============================================
// Simple key-value store in a Google Sheet tab.
// Col A = key, Col B = JSON value

function handleStorageSet(key, payload) {
  if (!key) return jsonResponse({ status: 'error', message: 'Missing key' });

  const sheet = getOrCreateAppDataSheet();
  const data = sheet.getDataRange().getValues();

  // Find existing row for this key
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(payload || '');
      return jsonResponse({ status: 'ok', action: 'updated', key: key });
    }
  }

  // New key — append
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
    if (key && key !== 'key') {  // Skip header row if present
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

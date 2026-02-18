/**
 * HYROX ENGINE - Google Apps Script v4
 * Receives JSON from Health Auto Export and writes to Google Sheets
 * v4: Fixed sleep data handling — supports both interval and aggregated formats
 */

// ============================================
// CONFIGURATION
// ============================================
const WORKOUTS_SHEET = 'Workouts';
const METRICS_SHEET = 'DailyMetrics';
const LOG_SHEET = 'SyncLog';

// ============================================
// MAIN ENTRY POINT
// ============================================
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseError) {
      logSync(sheet, 'Error parsing JSON: ' + parseError.message);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Invalid JSON'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Health Auto Export format
    if (data.data && data.data.workouts) {
      processWorkouts(sheet, data.data.workouts);
      logSync(sheet, 'Processed ' + data.data.workouts.length + ' workouts');
    } else if (data.data && data.data.metrics) {
      processMetrics(sheet, data.data.metrics);
    } else if (data.workouts) {
      processWorkouts(sheet, data.workouts);
    } else if (data.metrics) {
      processMetrics(sheet, data.metrics);
    } else if (Array.isArray(data)) {
      if (data.length > 0 && (data[0].name || data[0].workoutActivityType)) {
        processWorkouts(sheet, data);
      } else {
        processMetrics(sheet, data);
      }
    } else {
      logSync(sheet, 'Unknown format. Keys: ' + Object.keys(data).join(', '));
      logSync(sheet, 'Raw (first 2000 chars): ' + JSON.stringify(data).substring(0, 2000));
      logRawData(sheet, data);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet();
      logSync(sheet, 'ERROR: ' + error.message + ' | Stack: ' + error.stack);
    } catch (e) {}

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'HYROX ENGINE endpoint v4 running',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// EXTRACT VALUE FROM NESTED OBJECTS
// ============================================
function extractValue(obj) {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'string') {
    const num = parseFloat(obj);
    return isNaN(num) ? obj : num;
  }
  if (typeof obj === 'object') {
    if (obj.qty !== undefined) return extractValue(obj.qty);
    if (obj.value !== undefined) return extractValue(obj.value);
    if (obj.average !== undefined) return extractValue(obj.average);
    if (obj.avg !== undefined) return extractValue(obj.avg);
    if (obj.max !== undefined) return extractValue(obj.max);
    if (obj.min !== undefined) return extractValue(obj.min);
    if (obj.sum !== undefined) return extractValue(obj.sum);
    if (obj.asleep !== undefined) return extractValue(obj.asleep);
    if (obj.duration !== undefined) return extractValue(obj.duration);
  }
  return '';
}

function extractHR(workout, type) {
  if (type === 'avg') {
    if (workout.avgHeartRate !== undefined) return extractValue(workout.avgHeartRate);
    if (workout.heartRateAverage !== undefined) return extractValue(workout.heartRateAverage);
    if (workout.averageHeartRate !== undefined) return extractValue(workout.averageHeartRate);
  }
  if (type === 'max') {
    if (workout.maxHeartRate !== undefined) return extractValue(workout.maxHeartRate);
    if (workout.heartRateMax !== undefined) return extractValue(workout.heartRateMax);
    if (workout.maximumHeartRate !== undefined) return extractValue(workout.maximumHeartRate);
  }
  if (workout.heartRate) {
    if (type === 'avg' && workout.heartRate.avg !== undefined) return extractValue(workout.heartRate.avg);
    if (type === 'avg' && workout.heartRate.average !== undefined) return extractValue(workout.heartRate.average);
    if (type === 'max' && workout.heartRate.max !== undefined) return extractValue(workout.heartRate.max);
  }
  if (workout.heartRateData) {
    if (type === 'avg' && workout.heartRateData.avg !== undefined) return extractValue(workout.heartRateData.avg);
    if (type === 'max' && workout.heartRateData.max !== undefined) return extractValue(workout.heartRateData.max);
  }
  if (workout.statistics && workout.statistics.heartRate) {
    if (type === 'avg') return extractValue(workout.statistics.heartRate.average || workout.statistics.heartRate.avg);
    if (type === 'max') return extractValue(workout.statistics.heartRate.max);
  }
  return '';
}

// ============================================
// PROCESS WORKOUTS
// ============================================
function processWorkouts(spreadsheet, workouts) {
  let ws = spreadsheet.getSheetByName(WORKOUTS_SHEET);
  if (!ws) {
    ws = spreadsheet.insertSheet(WORKOUTS_SHEET);
    ws.getRange(1, 1, 1, 12).setValues([[
      'Date', 'Workout Type', 'Duration (min)', 'Distance (km)',
      'Calories', 'Avg HR', 'Max HR', 'Avg Pace (sec/km)',
      'Elevation Gain (m)', 'Start Time', 'End Time', 'Source'
    ]]);
    ws.getRange(1, 1, 1, 12).setFontWeight('bold');
  }

  const existingData = ws.getDataRange().getValues();
  const existingKeys = new Set();
  for (let i = 1; i < existingData.length; i++) {
    let dateKey = existingData[i][0];
    if (dateKey instanceof Date) {
      dateKey = dateKey.toISOString().split('T')[0];
    } else {
      dateKey = String(dateKey).substring(0, 10);
    }
    const key = dateKey + '|' + existingData[i][1] + '|' + existingData[i][9];
    existingKeys.add(key);
  }

  const newRows = [];
  workouts.forEach(workout => {
    const dateStr = workout.start || workout.startDate || workout.date || '';
    const date = extractDate(dateStr);
    const type = workout.name || workout.workoutActivityType || workout.type || 'Unknown';

    let duration = extractValue(workout.duration);
    const startStr = workout.start || workout.startDate || '';
    const endStr = workout.end || workout.endDate || '';
    if (startStr && endStr) {
      try {
        const startMs = new Date(startStr.split(' +')[0].split(' -')[0]).getTime();
        const endMs = new Date(endStr.split(' +')[0].split(' -')[0]).getTime();
        if (startMs && endMs && endMs > startMs) {
          duration = Math.round((endMs - startMs) / 60000);
        }
      } catch(e) {}
    }
    if (duration > 300 && !startStr) duration = Math.round(duration / 60);

    let distance = '';
    if (workout.totalDistance !== undefined) {
      let d = extractValue(workout.totalDistance);
      if (d > 100) d = d / 1000;
      distance = d > 0 ? d.toFixed(2) : '';
    } else if (workout.distance !== undefined) {
      distance = extractValue(workout.distance);
      if (distance) distance = parseFloat(distance).toFixed(2);
    }

    let calories = '';
    if (workout.activeEnergyBurned !== undefined) {
      calories = Math.round(extractValue(workout.activeEnergyBurned));
    } else if (workout.activeEnergy !== undefined) {
      calories = Math.round(extractValue(workout.activeEnergy));
    } else if (workout.totalEnergyBurned !== undefined) {
      calories = Math.round(extractValue(workout.totalEnergyBurned));
    } else if (workout.calories !== undefined) {
      calories = Math.round(extractValue(workout.calories));
    }

    const avgHR = extractHR(workout, 'avg');
    const maxHR = extractHR(workout, 'max');

    let avgPace = '';
    const durationSec = duration * 60;
    const distanceKm = parseFloat(distance);
    if (durationSec > 0 && distanceKm > 0) {
      avgPace = Math.round(durationSec / distanceKm);
    }

    let elevation = '';
    if (workout.elevationAscended !== undefined) {
      elevation = Math.round(extractValue(workout.elevationAscended));
    } else if (workout.elevation !== undefined) {
      elevation = Math.round(extractValue(workout.elevation));
    }

    const startTime = formatTime(workout.start || workout.startDate);
    const endTime = formatTime(workout.end || workout.endDate);
    const source = workout.sourceName || workout.source || '';

    const key = date + '|' + type + '|' + startTime;
    if (!existingKeys.has(key) && date) {
      newRows.push([
        date, type, duration, distance, calories,
        avgHR ? Math.round(avgHR) : '',
        maxHR ? Math.round(maxHR) : '',
        avgPace, elevation, startTime, endTime, source
      ]);
      existingKeys.add(key);
    }
  });

  if (newRows.length > 0) {
    ws.getRange(ws.getLastRow() + 1, 1, newRows.length, 12).setValues(newRows);
  }
  return newRows.length;
}

// ============================================
// PROCESS HEALTH METRICS
// ============================================
function processMetrics(spreadsheet, metrics) {
  let ws = spreadsheet.getSheetByName(METRICS_SHEET);
  if (!ws) {
    ws = spreadsheet.insertSheet(METRICS_SHEET);
    ws.getRange(1, 1, 1, 11).setValues([[
      'Date', 'Resting HR', 'HRV (ms)', 'VO2 Max',
      'Sleep Duration (hr)', 'Deep Sleep (hr)', 'REM Sleep (hr)',
      'Walking HR Avg', 'Steps', 'Active Calories', 'Weight (kg)'
    ]]);
    ws.getRange(1, 1, 1, 11).setFontWeight('bold');
  }

  const existingData = ws.getDataRange().getValues();
  const existingDates = new Map();
  for (let i = 1; i < existingData.length; i++) {
    let dateKey = existingData[i][0];
    if (dateKey instanceof Date) {
      dateKey = dateKey.toISOString().split('T')[0];
    } else {
      dateKey = String(dateKey).substring(0, 10);
    }
    if (dateKey && !existingDates.has(dateKey)) {
      existingDates.set(dateKey, i + 1);
    }
  }

  // Log ALL metric names we receive
  const metricNames = [];
  const metricsArray = Array.isArray(metrics) ? metrics : [metrics];
  metricsArray.forEach(m => {
    if (m.name) metricNames.push(m.name);
    if (m.name && m.name.toLowerCase().includes('sleep')) {
      logSync(spreadsheet, 'SLEEP METRIC FOUND: name="' + m.name + '" | data points: ' + (m.data ? m.data.length : 0) + ' | sample: ' + JSON.stringify(m.data ? m.data[0] : m).substring(0, 500));
    }
  });
  logSync(spreadsheet, 'Metrics received: [' + metricNames.join(', ') + ']');

  // Group metrics by date
  const metricsByDate = {};

  metricsArray.forEach(metric => {
    if (metric.data && Array.isArray(metric.data)) {

      // ── SLEEP: Handle at the metric level (needs all data points at once) ──
      if (metric.name && metric.name.toLowerCase() === 'sleep_analysis') {
        processSleepAnalysis(spreadsheet, metric.data, metricsByDate);
        return; // Next metric
      }

      // ── All other metrics: process per data point ──
      metric.data.forEach(item => {
        const date = extractDate(item.date);
        if (!date) return;
        if (!metricsByDate[date]) metricsByDate[date] = {};
        const val = extractValue(item);
        mapMetricValue(metric.name, val, metricsByDate[date]);
      });

    } else if (metric.qty !== undefined || metric.value !== undefined) {
      const date = extractDate(metric.date);
      if (!date) return;
      if (!metricsByDate[date]) metricsByDate[date] = {};
      mapMetricValue(metric.name || 'unknown', extractValue(metric), metricsByDate[date]);
    }
  });

  // Log what we actually mapped
  const mappedDates = Object.keys(metricsByDate);
  if (mappedDates.length > 0) {
    const sampleDate = mappedDates[mappedDates.length - 1];
    logSync(spreadsheet, 'Mapped ' + mappedDates.length + ' dates. Latest (' + sampleDate + '): ' + JSON.stringify(metricsByDate[sampleDate]));
  }

  // Update or append rows
  Object.keys(metricsByDate).forEach(date => {
    const m = metricsByDate[date];
    const row = [
      date,
      m.restingHR || '',
      m.hrv || '',
      m.vo2Max || '',
      m.sleepDuration || '',
      m.deepSleep || '',
      m.remSleep || '',
      m.walkingHR || '',
      m.steps || '',
      m.activeCalories || '',
      m.weight || ''
    ];

    if (existingDates.has(date)) {
      const rowNum = existingDates.get(date);
      const existingRow = ws.getRange(rowNum, 1, 1, 11).getValues()[0];
      for (let i = 1; i < row.length; i++) {
        if (row[i] === '' && existingRow[i] !== '') {
          row[i] = existingRow[i];
        }
      }
      ws.getRange(rowNum, 1, 1, 11).setValues([row]);
    } else {
      ws.appendRow(row);
      existingDates.set(date, ws.getLastRow());
    }
  });
}

// ============================================
// SLEEP ANALYSIS PROCESSOR (NEW in v4)
// Handles both interval and aggregated formats
// from Health Auto Export
// ============================================
/**
 * Format A — INTERVALS (most common from Apple Watch):
 *   Each data point is one sleep segment with a category string + timestamps
 *   { value: "AsleepDeep", startDate: "2026-02-18 01:30:00 +0000", endDate: "2026-02-18 02:15:00 +0000" }
 *
 * Format B — AGGREGATED:
 *   One data point per night with summary fields
 *   { date: "2026-02-18", asleep: 6.8, sleepDeep: 1.8, sleepCore: 3.2, sleepREM: 1.5 }
 */
function processSleepAnalysis(spreadsheet, dataPoints, metricsByDate) {
  if (!dataPoints || !Array.isArray(dataPoints) || dataPoints.length === 0) {
    logSync(spreadsheet, 'SLEEP: No data points');
    return;
  }

  const firstItem = dataPoints[0];

  // Detect format: interval (category strings with timestamps) vs aggregated (summary numbers)
  const isIntervalFormat = firstItem.value && typeof firstItem.value === 'string' &&
    /asleep|inbed|awake|sleep/i.test(firstItem.value) &&
    (firstItem.startDate || firstItem.start);

  logSync(spreadsheet, 'SLEEP: ' + dataPoints.length + ' points, format=' +
    (isIntervalFormat ? 'INTERVAL' : 'AGGREGATED') +
    ', sample=' + JSON.stringify(firstItem).substring(0, 500));

  if (isIntervalFormat) {
    // ── INTERVAL FORMAT ──────────────────────────────────────
    const sleepByNight = {};

    dataPoints.forEach(item => {
      const category = (item.value || '').toLowerCase();

      // Skip non-sleep categories (InBed, Awake)
      if (category === 'inbed' || category === 'awake') return;

      const startStr = item.startDate || item.start || '';
      const endStr = item.endDate || item.end || '';
      if (!startStr || !endStr) return;

      try {
        const startMs = new Date(startStr.split(' +')[0].split(' -')[0]).getTime();
        const endMs = new Date(endStr.split(' +')[0].split(' -')[0]).getTime();
        if (!startMs || !endMs || endMs <= startMs) return;

        const durationHrs = (endMs - startMs) / 3600000;
        if (durationHrs <= 0 || durationHrs > 14) return; // Sanity check

        // Assign sleep to the morning date (sleep starting after 6pm → next day)
        const startDate = new Date(startMs);
        let nightDate;
        if (startDate.getHours() >= 18) {
          nightDate = new Date(startMs + 86400000);
        } else {
          nightDate = startDate;
        }
        const dateKey = nightDate.toISOString().split('T')[0];

        if (!sleepByNight[dateKey]) {
          sleepByNight[dateKey] = { deep: 0, core: 0, rem: 0, total: 0 };
        }

        if (category.includes('deep')) {
          sleepByNight[dateKey].deep += durationHrs;
        } else if (category.includes('rem')) {
          sleepByNight[dateKey].rem += durationHrs;
        } else {
          // AsleepCore, Asleep, AsleepUnspecified → core/light
          sleepByNight[dateKey].core += durationHrs;
        }
        sleepByNight[dateKey].total += durationHrs;
      } catch (e) {}
    });

    // Write to metricsByDate
    Object.keys(sleepByNight).forEach(date => {
      if (!metricsByDate[date]) metricsByDate[date] = {};
      const s = sleepByNight[date];
      if (s.total > 0.5) { // At least 30 min to count
        metricsByDate[date].sleepDuration = s.total.toFixed(2);
        if (s.deep > 0) metricsByDate[date].deepSleep = s.deep.toFixed(2);
        if (s.rem > 0) metricsByDate[date].remSleep = s.rem.toFixed(2);
      }
    });

    const nights = Object.keys(sleepByNight);
    if (nights.length > 0) {
      const latestKey = nights.sort()[nights.length - 1];
      logSync(spreadsheet, 'SLEEP RESULT: ' + nights.length + ' nights processed. Latest (' + latestKey + '): ' +
        JSON.stringify(sleepByNight[latestKey]));
    } else {
      logSync(spreadsheet, 'SLEEP RESULT: 0 nights (no valid intervals found)');
    }

  } else {
    // ── AGGREGATED FORMAT ─────────────────────────────────────
    let processedCount = 0;

    dataPoints.forEach(item => {
      const date = extractDate(item.date);
      if (!date) return;
      if (!metricsByDate[date]) metricsByDate[date] = {};

      // Try ALL known field name variants from Health Auto Export
      const deep = parseFloat(item.sleepDeep) || parseFloat(item.deep) || 0;
      const core = parseFloat(item.sleepCore) || parseFloat(item.core) || 0;
      const rem = parseFloat(item.sleepREM) || parseFloat(item.rem) || 0;
      const asleep = parseFloat(item.asleep) || 0;
      const inBed = parseFloat(item.inBed) || parseFloat(item.inbed) || 0;
      const qty = parseFloat(item.qty) || 0;

      // Determine total sleep duration
      let totalSleep = 0;
      let deepHrs = deep;
      let remHrs = rem;

      if (deep + core + rem > 0) {
        totalSleep = deep + core + rem;
      } else if (asleep > 0) {
        totalSleep = asleep;
      } else if (qty > 0) {
        totalSleep = qty;
      } else if (inBed > 0) {
        totalSleep = inBed;
      }

      // Unit conversion: >1440 = seconds, >24 = minutes, <=24 = hours
      if (totalSleep > 1440) {
        totalSleep /= 3600;
        deepHrs = deep > 0 ? deep / 3600 : 0;
        remHrs = rem > 0 ? rem / 3600 : 0;
      } else if (totalSleep > 24) {
        totalSleep /= 60;
        deepHrs = deep > 0 ? deep / 60 : 0;
        remHrs = rem > 0 ? rem / 60 : 0;
      }

      if (totalSleep > 0.5 && totalSleep < 24) {
        metricsByDate[date].sleepDuration = totalSleep.toFixed(2);
        processedCount++;
      }
      if (deepHrs > 0 && deepHrs < 24) {
        metricsByDate[date].deepSleep = deepHrs.toFixed(2);
      }
      if (remHrs > 0 && remHrs < 24) {
        metricsByDate[date].remSleep = remHrs.toFixed(2);
      }
    });

    logSync(spreadsheet, 'SLEEP RESULT: ' + processedCount + '/' + dataPoints.length + ' aggregated entries had valid sleep data');
  }
}

// ============================================
// MAP METRIC NAME → FIELD
// ============================================
function mapMetricValue(name, value, dateMetrics) {
  if (!name || value === '' || value === null || value === undefined) return;

  const n = name.toLowerCase();

  if (n.includes('resting') && n.includes('heart')) {
    dateMetrics.restingHR = Math.round(value);
  } else if (n.includes('hrv') || n.includes('variability')) {
    dateMetrics.hrv = value;
  } else if (n.includes('vo2')) {
    dateMetrics.vo2Max = value;
  } else if (n.includes('deep') && n.includes('sleep')) {
    // Unit conversion: >1440 = seconds, >24 = minutes, <=24 = hours
    dateMetrics.deepSleep = value > 1440 ? (value / 3600).toFixed(2) : value > 24 ? (value / 60).toFixed(2) : value > 0 ? value.toFixed(2) : '';
  } else if (n.includes('rem') && n.includes('sleep')) {
    dateMetrics.remSleep = value > 1440 ? (value / 3600).toFixed(2) : value > 24 ? (value / 60).toFixed(2) : value > 0 ? value.toFixed(2) : '';
  } else if (n.includes('core') && n.includes('sleep')) {
    dateMetrics.coreSleep = value > 1440 ? (value / 3600).toFixed(2) : value > 24 ? (value / 60).toFixed(2) : value > 0 ? value.toFixed(2) : '';
  } else if (n.includes('sleep') || n.includes('asleep') || n.includes('in_bed') || n.includes('inbed') || n.includes('time_in_bed')) {
    dateMetrics.sleepDuration = value > 1440 ? (value / 3600).toFixed(2) : value > 24 ? (value / 60).toFixed(2) : value > 0 ? value.toFixed(2) : '';
  } else if (n.includes('walking') && n.includes('heart')) {
    dateMetrics.walkingHR = Math.round(value);
  } else if (n.includes('step') && !n.includes('heart')) {
    dateMetrics.steps = Math.round(value);
  } else if (n.includes('active') && (n.includes('energy') || n.includes('calori'))) {
    dateMetrics.activeCalories = Math.round(value);
  } else if (n.includes('body') && n.includes('mass')) {
    dateMetrics.weight = value.toFixed(1);
  } else if (n.includes('weight')) {
    dateMetrics.weight = value.toFixed(1);
  }

  // If we have deep + rem + core but no total sleep, calculate it
  if (!dateMetrics.sleepDuration && (dateMetrics.deepSleep || dateMetrics.remSleep || dateMetrics.coreSleep)) {
    const deep = parseFloat(dateMetrics.deepSleep) || 0;
    const rem = parseFloat(dateMetrics.remSleep) || 0;
    const core = parseFloat(dateMetrics.coreSleep) || 0;
    if (deep + rem + core > 0) {
      dateMetrics.sleepDuration = (deep + rem + core).toFixed(2);
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function extractDate(dateStr) {
  if (!dateStr) return '';
  try {
    let d;
    if (typeof dateStr === 'string') {
      const cleanDate = dateStr.split(' +')[0].split(' -')[0];
      d = new Date(cleanDate);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const cleanDate = dateStr.split(' +')[0].split(' -')[0];
    const d = new Date(cleanDate);
    if (isNaN(d.getTime())) return '';
    return d.toTimeString().split(' ')[0].substring(0, 5);
  } catch (e) {
    return '';
  }
}

// ============================================
// LOGGING
// ============================================
function logSync(spreadsheet, message) {
  let ws = spreadsheet.getSheetByName(LOG_SHEET);
  if (!ws) {
    ws = spreadsheet.insertSheet(LOG_SHEET);
    ws.getRange(1, 1, 1, 2).setValues([['Timestamp', 'Message']]);
    ws.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  ws.appendRow([new Date().toISOString(), message]);
  const lastRow = ws.getLastRow();
  if (lastRow > 200) {
    ws.deleteRows(2, lastRow - 200);
  }
}

function logRawData(spreadsheet, data) {
  let ws = spreadsheet.getSheetByName('RawData');
  if (!ws) {
    ws = spreadsheet.insertSheet('RawData');
    ws.getRange(1, 1, 1, 2).setValues([['Timestamp', 'Data']]);
    ws.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  ws.appendRow([new Date().toISOString(), JSON.stringify(data).substring(0, 50000)]);
}

// ============================================
// UTILITY
// ============================================
function clearWorkouts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const ws = sheet.getSheetByName(WORKOUTS_SHEET);
  if (ws) {
    const lastRow = ws.getLastRow();
    if (lastRow > 1) {
      ws.deleteRows(2, lastRow - 1);
    }
  }
  logSync(sheet, 'Cleared workouts sheet');
}

/**
 * RUN THIS ONCE to remove duplicate workout rows.
 * Keeps one row per unique date + type + start time combination.
 * Go to Apps Script > Run > consolidateWorkouts
 */
function consolidateWorkouts() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ws = spreadsheet.getSheetByName(WORKOUTS_SHEET);
  if (!ws) return;

  const data = ws.getDataRange().getValues();
  const headers = data[0];
  const seen = new Set();
  const unique = [];

  for (let i = 1; i < data.length; i++) {
    let dateKey = data[i][0];
    if (dateKey instanceof Date) {
      dateKey = dateKey.toISOString().split('T')[0];
    } else {
      dateKey = String(dateKey).substring(0, 10);
    }

    const type = data[i][1];
    const startTime = data[i][9];
    const key = dateKey + '|' + type + '|' + startTime;

    if (!seen.has(key) && dateKey) {
      seen.add(key);
      let dur = parseFloat(data[i][2]);
      if (dur > 300) {
        const start = data[i][9];
        const end = data[i][10];
        if (start && end) {
          const startParts = String(start).split(':');
          const endParts = String(end).split(':');
          if (startParts.length >= 2 && endParts.length >= 2) {
            const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            if (endMin > startMin) {
              dur = endMin - startMin;
            }
          }
        }
        if (dur > 300) dur = Math.round(dur / 60);
        data[i][2] = dur;
      }
      data[i][0] = dateKey;
      unique.push(data[i]);
    }
  }

  const lastRow = ws.getLastRow();
  if (lastRow > 1) {
    ws.deleteRows(2, lastRow - 1);
  }
  if (unique.length > 0) {
    ws.getRange(2, 1, unique.length, headers.length).setValues(unique);
  }
  logSync(spreadsheet, 'Consolidated Workouts: ' + (data.length - 1) + ' rows -> ' + unique.length + ' unique workouts');
}

function testEndpoint() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  logSync(sheet, 'Manual test v4 - endpoint working');
  Logger.log('Test successful');
}

/**
 * RUN THIS ONCE to clean up duplicate rows in DailyMetrics.
 * Merges all rows with the same date into a single row, keeping non-empty values.
 * Go to Apps Script > Run > consolidateDailyMetrics
 */
function consolidateDailyMetrics() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ws = spreadsheet.getSheetByName(METRICS_SHEET);
  if (!ws) return;

  const data = ws.getDataRange().getValues();
  const headers = data[0];

  const byDate = {};
  for (let i = 1; i < data.length; i++) {
    let dateKey = data[i][0];
    if (dateKey instanceof Date) {
      dateKey = dateKey.toISOString().split('T')[0];
    } else {
      dateKey = String(dateKey).substring(0, 10);
    }
    if (!dateKey || dateKey === 'undefined' || dateKey === '') continue;
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(data[i]);
  }

  const merged = [];
  const sumColumns = ['Steps', 'Active Calories'];
  const sumIndices = sumColumns.map(name => headers.indexOf(name)).filter(i => i >= 0);

  Object.keys(byDate).sort().forEach(date => {
    const rows = byDate[date];
    const result = [date];
    for (let col = 1; col < headers.length; col++) {
      if (sumIndices.includes(col)) {
        let maxVal = '';
        rows.forEach(row => {
          const val = parseFloat(row[col]);
          if (!isNaN(val) && val > 0 && (maxVal === '' || val > maxVal)) {
            maxVal = val;
          }
        });
        result.push(maxVal);
      } else {
        let bestVal = '';
        rows.forEach(row => {
          const val = row[col];
          if (val !== '' && val !== null && val !== undefined) {
            const num = parseFloat(val);
            if (!isNaN(num) && num > 0) {
              bestVal = val;
            }
          }
        });
        result.push(bestVal);
      }
    }
    merged.push(result);
  });

  const lastRow = ws.getLastRow();
  if (lastRow > 1) {
    ws.deleteRows(2, lastRow - 1);
  }
  if (merged.length > 0) {
    ws.getRange(2, 1, merged.length, headers.length).setValues(merged);
  }
  logSync(spreadsheet, 'Consolidated DailyMetrics: ' + data.length + ' rows -> ' + merged.length + ' unique dates');
}

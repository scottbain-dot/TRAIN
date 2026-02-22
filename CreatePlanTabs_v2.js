/**
 * HYROX ENGINE — Training Plan Tabs v2
 * 
 * Run createTrainingPlanTabs() to create/replace:
 *   WeeklyPlan, StrengthA, StrengthB
 * 
 * CHANGES from v1:
 *   - B-Race phase removed, Build 1 extended to 8 weeks
 *   - All phases now 8 weeks (except Peak+Taper = 4)
 *   - 4-week cycle: Wk 1-3 normal, Wk 4 deload/test
 *   - Base 1: Progressive run Wed, Strides Thu, VO₂ strides from wk1
 *   - Base 2+: Alternating threshold (Wk A) / compromised running (Wk B)
 *   - VO₂max sessions from Base 2 (Sunday)
 *   - Station priority: Ski Erg, Sled Push, Rowing, Farmer Carry
 *   - Deload/test weeks include 2km TT, threshold test, mini-sim
 */
function createTrainingPlanTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ═══════════════════════════════════════
  // TAB 1: WeeklyPlan
  // ═══════════════════════════════════════
  let wpSheet = ss.getSheetByName('WeeklyPlan');
  if (wpSheet) ss.deleteSheet(wpSheet);
  wpSheet = ss.insertSheet('WeeklyPlan');
  
  const wpHeaders = ['Day', 'Session Type', 'Zone', 'Duration', 'Distance', 'Main Focus', 'Details / Structure', 'Targets', 'Phase', 'Week Type'];
  wpSheet.appendRow(wpHeaders);
  
  const wpData = [
    // ═══════════════════════════════════════
    // BASE 1 — Normal weeks (Wk 1-3 of each 4-week cycle)
    // ═══════════════════════════════════════
    ['Monday', 'Easy Run', 'Z2', '50 min', '8 km', 'Aerobic base building', 'Conversational pace throughout', 'HR 130-145 · Pace 5:30-6:30/km', 'Base 1', 'Normal'],
    ['Tuesday', 'Strength A: Push', 'Strength', '60 min', '—', 'Lower + Upper Push, Power, Sprints', 'See StrengthA tab — alternates Wk A/B', '—', 'Base 1', 'Normal'],
    ['Wednesday', 'Progressive Run', 'Z2', '50 min', '8 km', 'Teaching the gear change', 'Easy 35min → last 15min build to tempo feel', 'HR 130-145 → 155-165 last 15min', 'Base 1', 'Normal'],
    ['Thursday', 'Easy Run + Strides', 'Z2', '45 min', '7 km', 'Easy run + VO₂ strides', 'Easy 37min → 6×30s strides @90% effort (60s walk)', 'HR 130-145 · Strides: fast but relaxed', 'Base 1', 'Normal'],
    ['Friday', 'Strength B: Pull', 'Strength', '60 min', '—', 'Lower + Upper Pull, Power, Sprints', 'See StrengthB tab — alternates Wk A/B', '—', 'Base 1', 'Normal'],
    ['Saturday', 'Long Run', 'Z2', '75 min', '12 km', 'Time on feet → build to 90min', 'Build 5min/week. Flat to rolling.', 'HR 130-145 · Talk in sentences', 'Base 1', 'Normal'],
    ['Sunday', 'Rest', 'Rest', '0 min', '—', 'Full rest', 'Recovery is where adaptation happens', '—', 'Base 1', 'Normal'],
    
    // BASE 1 — Deload/Test week (Wk 4 of each 4-week cycle)
    ['Monday', 'Easy Run', 'Z2', '30 min', '5 km', 'DELOAD — 60% volume', 'Keep easy', 'HR 130-145', 'Base 1', 'Deload'],
    ['Tuesday', 'Strength A (light)', 'Strength', '45 min', '—', 'Reduced: 2 sets per exercise', 'Movement quality. Moderate loads.', '—', 'Base 1', 'Deload'],
    ['Wednesday', '2km Time Trial', 'VO₂max', '25 min', '4 km', 'TEST: 2km TT — track your time!', 'WU 10min + 3 strides → 2km ALL OUT → CD 5min', 'Record time + avg HR', 'Base 1', 'Deload'],
    ['Thursday', 'Rest', 'Rest', '0 min', '—', 'Recovery after TT', '—', '—', 'Base 1', 'Deload'],
    ['Friday', 'Strength B (light)', 'Strength', '45 min', '—', 'Reduced: 2 sets per exercise', 'Movement quality.', '—', 'Base 1', 'Deload'],
    ['Saturday', 'Easy Run', 'Z2', '45 min', '7 km', 'Shorter long run', 'Easy shake-out', 'HR 130-145', 'Base 1', 'Deload'],
    ['Sunday', 'Rest', 'Rest', '0 min', '—', 'Full rest', 'Recover for next cycle', '—', 'Base 1', 'Deload'],
    
    // ═══════════════════════════════════════
    // BASE 2 — Normal weeks (alternating Wk A / Wk B)
    // ═══════════════════════════════════════
    ['Monday', 'Easy Run', 'Z2', '50 min', '8 km', 'Aerobic base', 'Morning Z2', 'HR 130-145', 'Base 2', 'Normal-A'],
    ['Tuesday', 'Strength A: Push', 'Strength', '60 min', '—', 'Lower + Upper Push, Power, Sprints', 'See StrengthA tab', '—', 'Base 2', 'Normal-A'],
    ['Wednesday', 'Running Threshold', 'Threshold', '45 min', '7 km', 'Pure running threshold — clean data', 'WU 10min → Tempo 20min → CD 10min', 'HR 160-170 · Pace 4:30-5:00/km', 'Base 2', 'Normal-A'],
    ['Thursday', 'Easy Run + Strides', 'Z2', '45 min', '7 km', 'Easy + 6×30s strides', 'Easy 37min → strides', 'HR 130-145', 'Base 2', 'Normal-A'],
    ['Friday', 'Strength B: Pull', 'Strength', '60 min', '—', 'Lower + Upper Pull, Power, Sprints', 'See StrengthB tab', '—', 'Base 2', 'Normal-A'],
    ['Saturday', 'Long Run', 'Z2', '90 min', '14 km', 'Build to 100min', 'Volume accumulation', 'HR 130-145', 'Base 2', 'Normal-A'],
    ['Sunday', 'VO₂max Intervals', 'VO₂max', '35 min', '5 km', 'VO₂max stimulus — push the ceiling', 'WU 10min → 4×3min hard (3min jog) → CD 8min', 'HR 170-185', 'Base 2', 'Normal-A'],
    
    ['Monday', 'Easy Run', 'Z2', '50 min', '8 km', 'Aerobic base', 'Morning Z2', 'HR 130-145', 'Base 2', 'Normal-B'],
    ['Tuesday', 'Strength A: Push', 'Strength', '60 min', '—', 'Lower + Upper Push, Power, Sprints', 'See StrengthA tab', '—', 'Base 2', 'Normal-B'],
    ['Wednesday', 'Compromised Running', 'Threshold', '50 min', '6 km', '1km repeats + stations — race-specific', 'WU 10min → 4×(1km threshold + ski erg 500m) → CD 5min', 'HR 160-170 · Track splits + decay', 'Base 2', 'Normal-B'],
    ['Thursday', 'Easy Run + Strides', 'Z2', '45 min', '7 km', 'Easy + strides', 'Easy 37min → 6×30s strides', 'HR 130-145', 'Base 2', 'Normal-B'],
    ['Friday', 'Strength B: Pull', 'Strength', '60 min', '—', 'Lower + Upper Pull, Power, Sprints', 'See StrengthB tab', '—', 'Base 2', 'Normal-B'],
    ['Saturday', 'Long Run', 'Z2', '90 min', '14 km', 'Build to 100min', 'Volume accumulation', 'HR 130-145', 'Base 2', 'Normal-B'],
    ['Sunday', 'VO₂max Intervals', 'VO₂max', '35 min', '5 km', 'VO₂max stimulus', 'WU 10min → 4×3min hard (3min jog) → CD 8min', 'HR 170-185', 'Base 2', 'Normal-B'],
    
    // BASE 2 — Deload
    ['Monday', 'Easy Run', 'Z2', '30 min', '5 km', 'DELOAD — 60% volume', 'Keep easy', 'HR 130-145', 'Base 2', 'Deload'],
    ['Tuesday', 'Strength A (light)', 'Strength', '45 min', '—', 'Reduced: 2 sets', '—', '—', 'Base 2', 'Deload'],
    ['Wednesday', '2km TT or 20min Threshold Test', 'VO₂max', '30 min', '5 km', 'TEST: Alternate each deload', 'WU 10min → Test → CD 5min', 'Record time/distance + HR', 'Base 2', 'Deload'],
    ['Thursday', 'Rest', 'Rest', '0 min', '—', 'Recovery after test', '—', '—', 'Base 2', 'Deload'],
    ['Friday', 'Strength B (light)', 'Strength', '45 min', '—', 'Reduced: 2 sets', '—', '—', 'Base 2', 'Deload'],
    ['Saturday', 'Mini-Sim Test', 'Simulation', '40 min', '4 km', 'TEST: 4×(1km + ski erg 500m)', 'Track splits, station times, pace decay', 'Record all splits', 'Base 2', 'Deload'],
    ['Sunday', 'Rest', 'Rest', '0 min', '—', 'Full rest', '—', '—', 'Base 2', 'Deload'],
    
    // ═══════════════════════════════════════
    // BUILD 1 — Normal weeks
    // ═══════════════════════════════════════
    ['Monday', 'Easy Run', 'Z2', '50 min', '8 km', 'Aerobic volume', 'Morning Z2', 'HR 130-145', 'Build 1', 'Normal-A'],
    ['Tuesday', 'Strength A: Push', 'Strength', '60 min', '—', 'Lower + Upper Push, Power, Sprints', 'See StrengthA tab', '—', 'Build 1', 'Normal-A'],
    ['Wednesday', 'Threshold Intervals', 'Threshold', '45 min', '8 km', 'Threshold repeats — clean data', 'WU 10min → 4×8min threshold (2min jog) → CD 10min', 'HR 160-170 · Pace 4:20-4:50/km', 'Build 1', 'Normal-A'],
    ['Thursday', 'Easy Run', 'Z2', '50 min', '8 km', 'Recovery volume', 'Conversational', 'HR 130-145', 'Build 1', 'Normal-A'],
    ['Friday', 'Strength B: Pull', 'Strength', '60 min', '—', 'Lower + Upper Pull, Power, Sprints', 'See StrengthB tab', '—', 'Build 1', 'Normal-A'],
    ['Saturday', 'Long Run', 'Z2', '100 min', '16 km', 'Build to 110min', 'Time on feet', 'HR 130-145', 'Build 1', 'Normal-A'],
    ['Sunday', 'VO₂max Intervals', 'VO₂max', '40 min', '6 km', 'Expand aerobic ceiling', 'WU 10min → 5×4min hard (3min jog) → CD 10min', 'HR 170-185', 'Build 1', 'Normal-A'],
    
    ['Monday', 'Easy Run', 'Z2', '50 min', '8 km', 'Aerobic volume', 'Morning Z2', 'HR 130-145', 'Build 1', 'Normal-B'],
    ['Tuesday', 'Strength A: Push', 'Strength', '60 min', '—', 'Lower + Upper Push, Power, Sprints', 'See StrengthA tab', '—', 'Build 1', 'Normal-B'],
    ['Wednesday', 'Compromised Running', 'Threshold', '50 min', '6 km', '4×(1km + station) — ski erg or sled push', 'WU 10min → 4×(1km threshold + ski erg 500m or sled 4×25m) → CD 5min', 'Track splits · Priority: ski erg, sled push', 'Build 1', 'Normal-B'],
    ['Thursday', 'Easy Run', 'Z2', '50 min', '8 km', 'Recovery volume', 'Conversational', 'HR 130-145', 'Build 1', 'Normal-B'],
    ['Friday', 'Strength B: Pull', 'Strength', '60 min', '—', 'Lower + Upper Pull, Power, Sprints', 'See StrengthB tab', '—', 'Build 1', 'Normal-B'],
    ['Saturday', 'Long Run', 'Z2', '100 min', '16 km', 'Build to 110min', 'Time on feet', 'HR 130-145', 'Build 1', 'Normal-B'],
    ['Sunday', 'VO₂max Intervals', 'VO₂max', '40 min', '6 km', 'Expand aerobic ceiling', 'WU 10min → 5×4min hard (3min jog) → CD 10min', 'HR 170-185', 'Build 1', 'Normal-B'],
    
    // BUILD 1 — Deload
    ['Monday', 'Easy Run', 'Z2', '30 min', '5 km', 'DELOAD — 60% volume', 'Keep easy', 'HR 130-145', 'Build 1', 'Deload'],
    ['Tuesday', 'Strength A (light)', 'Strength', '45 min', '—', 'Reduced: 2 sets', '—', '—', 'Build 1', 'Deload'],
    ['Wednesday', '2km TT or 20min Threshold Test', 'VO₂max', '30 min', '5 km', 'TEST: Alternate each deload', '—', 'Record time + HR', 'Build 1', 'Deload'],
    ['Thursday', 'Rest', 'Rest', '0 min', '—', 'Recovery', '—', '—', 'Build 1', 'Deload'],
    ['Friday', 'Strength B (light)', 'Strength', '45 min', '—', 'Reduced: 2 sets', '—', '—', 'Build 1', 'Deload'],
    ['Saturday', 'Mini-Sim Test', 'Simulation', '45 min', '4 km', 'TEST: 4×(1km + station)', 'Rotate: ski erg → sled push → row → farmer carry', 'Track all splits', 'Build 1', 'Deload'],
    ['Sunday', 'Rest', 'Rest', '0 min', '—', 'Full rest', '—', '—', 'Build 1', 'Deload'],
    
    // ═══════════════════════════════════════
    // BUILD 2 — Normal weeks (same structure, higher volume)
    // ═══════════════════════════════════════
    ['Monday', 'Easy Run', 'Z2', '55 min', '9 km', 'Aerobic volume — peak phase', 'Morning Z2', 'HR 130-145', 'Build 2', 'Normal-A'],
    ['Tuesday', 'Strength A: Push', 'Strength', '60 min', '—', 'Lower + Upper Push, Power, Sprints', 'See StrengthA tab', '—', 'Build 2', 'Normal-A'],
    ['Wednesday', 'Threshold Intervals', 'Threshold', '50 min', '9 km', 'Push threshold pace', 'WU 10min → 5×8min threshold (2min jog) → CD 10min', 'HR 160-170 · Pace 4:20-4:50/km', 'Build 2', 'Normal-A'],
    ['Thursday', 'Easy Run', 'Z2', '50 min', '8 km', 'Recovery volume', 'Conversational', 'HR 130-145', 'Build 2', 'Normal-A'],
    ['Friday', 'Strength B: Pull', 'Strength', '60 min', '—', 'Lower + Upper Pull, Power, Sprints', 'See StrengthB tab', '—', 'Build 2', 'Normal-A'],
    ['Saturday', 'Long Run', 'Z2', '115 min', '18 km', 'Peak long run 110-120min', 'Biggest run of the plan', 'HR 130-145', 'Build 2', 'Normal-A'],
    ['Sunday', 'VO₂max Intervals', 'VO₂max', '40 min', '6 km', 'Expand ceiling', 'WU 10min → 5×4min hard (3min jog) → CD 10min', 'HR 170-185', 'Build 2', 'Normal-A'],
    
    ['Monday', 'Easy Run', 'Z2', '55 min', '9 km', 'Aerobic volume', 'Morning Z2', 'HR 130-145', 'Build 2', 'Normal-B'],
    ['Tuesday', 'Strength A: Push', 'Strength', '60 min', '—', 'Lower + Upper Push, Power, Sprints', 'See StrengthA tab', '—', 'Build 2', 'Normal-B'],
    ['Wednesday', 'Compromised Running', 'Threshold', '50 min', '6 km', '4×(1km + station) — focus ski erg + sled', 'WU 10min → 4×(1km threshold + station) → CD 5min', 'Priority: ski erg, sled push', 'Build 2', 'Normal-B'],
    ['Thursday', 'Easy Run', 'Z2', '50 min', '8 km', 'Recovery', 'Conversational', 'HR 130-145', 'Build 2', 'Normal-B'],
    ['Friday', 'Strength B: Pull', 'Strength', '60 min', '—', 'Lower + Upper Pull, Power, Sprints', 'See StrengthB tab', '—', 'Build 2', 'Normal-B'],
    ['Saturday', 'Long Run', 'Z2', '115 min', '18 km', 'Peak long run', 'Time on feet', 'HR 130-145', 'Build 2', 'Normal-B'],
    ['Sunday', 'VO₂max Intervals', 'VO₂max', '40 min', '6 km', 'Expand ceiling', 'WU 10min → 6×4min hard (3min jog) → CD 10min', 'HR 170-185', 'Build 2', 'Normal-B'],
    
    // BUILD 2 — Deload
    ['Monday', 'Easy Run', 'Z2', '30 min', '5 km', 'DELOAD', 'Keep easy', 'HR 130-145', 'Build 2', 'Deload'],
    ['Tuesday', 'Strength A (light)', 'Strength', '45 min', '—', 'Reduced: 2 sets', '—', '—', 'Build 2', 'Deload'],
    ['Wednesday', '2km TT or 20min Threshold Test', 'VO₂max', '30 min', '5 km', 'TEST', '—', 'Record all', 'Build 2', 'Deload'],
    ['Thursday', 'Rest', 'Rest', '0 min', '—', 'Recovery', '—', '—', 'Build 2', 'Deload'],
    ['Friday', 'Strength B (light)', 'Strength', '45 min', '—', 'Reduced: 2 sets', '—', '—', 'Build 2', 'Deload'],
    ['Saturday', 'Mini-Sim Test', 'Simulation', '45 min', '4 km', 'TEST: 4×(1km + station)', 'Rotate focus station', 'Track all splits', 'Build 2', 'Deload'],
    ['Sunday', 'Rest', 'Rest', '0 min', '—', 'Full rest', '—', '—', 'Build 2', 'Deload'],
    
    // ═══════════════════════════════════════
    // RACE SPECIFIC — Compromised running EVERY week
    // ═══════════════════════════════════════
    ['Monday', 'Easy Run', 'Z2', '45 min', '7 km', 'Recovery from weekend', 'Easy', 'HR 130-145', 'Race Specific', 'Normal-A'],
    ['Tuesday', 'Strength A (reduced)', 'Strength', '50 min', '—', 'Maintenance: 2 sets + Sprints', 'See StrengthA tab (2 sets)', '—', 'Race Specific', 'Normal-A'],
    ['Wednesday', 'Compromised Running', 'Threshold', '50 min', '6 km', 'EVERY WEEK: 4×(1km + station)', 'WU 10 → 4×(1km threshold + station) → CD 5', 'Rotate: ski/sled/row/carry', 'Race Specific', 'Normal-A'],
    ['Thursday', 'Easy Run', 'Z2', '45 min', '7 km', 'Recovery', 'Conversational', 'HR 130-145', 'Race Specific', 'Normal-A'],
    ['Friday', 'Strength B (reduced)', 'Strength', '50 min', '—', 'Maintenance: 2 sets + Sprints', 'See StrengthB tab (2 sets)', '—', 'Race Specific', 'Normal-A'],
    ['Saturday', 'Long Run', 'Z2', '80 min', '12 km', 'Maintain aerobic base', 'Easy — maintain, don\'t build', 'HR 130-145', 'Race Specific', 'Normal-A'],
    ['Sunday', 'VO₂max / Sharp', 'VO₂max', '35 min', '5 km', 'Keep ceiling high', 'WU 10 → 6×2min hard (90s jog) → CD 10', 'Short and sharp', 'Race Specific', 'Normal-A'],
    
    ['Monday', 'Easy Run', 'Z2', '45 min', '7 km', 'Recovery', 'Easy', 'HR 130-145', 'Race Specific', 'Normal-B'],
    ['Tuesday', 'Strength A (reduced)', 'Strength', '50 min', '—', 'Maintenance + Sprints', '2 sets per exercise', '—', 'Race Specific', 'Normal-B'],
    ['Wednesday', 'Compromised Running', 'Threshold', '50 min', '6 km', '4×(1km + station)', 'WU 10 → 4×(1km + station) → CD 5', 'Rotate stations', 'Race Specific', 'Normal-B'],
    ['Thursday', 'Easy Run', 'Z2', '45 min', '7 km', 'Recovery', 'Conversational', 'HR 130-145', 'Race Specific', 'Normal-B'],
    ['Friday', 'Strength B (reduced)', 'Strength', '50 min', '—', 'Maintenance + Sprints', '2 sets per exercise', '—', 'Race Specific', 'Normal-B'],
    ['Saturday', 'Race Simulation', 'Simulation', '80 min', '8 km', 'Full or half sim (every 2 wk)', '4-8 rounds: 1km + station', 'Race pace · Pacing + transitions', 'Race Specific', 'Normal-B'],
    ['Sunday', 'VO₂max / Sharp', 'VO₂max', '35 min', '5 km', 'Keep ceiling high', 'WU 10 → 6×2min hard (90s jog) → CD 10', 'Short and sharp', 'Race Specific', 'Normal-B'],
    
    // RACE SPECIFIC — Deload
    ['Monday', 'Easy Run', 'Z2', '30 min', '5 km', 'DELOAD', 'Keep easy', 'HR 130-145', 'Race Specific', 'Deload'],
    ['Tuesday', 'Strength (light)', 'Strength', '40 min', '—', '2 sets. Maintenance.', '—', '—', 'Race Specific', 'Deload'],
    ['Wednesday', 'Test: Compromised Run', 'Threshold', '50 min', '6 km', 'TEST: 4×(1km + station)', 'Track splits + total vs previous', 'Record all', 'Race Specific', 'Deload'],
    ['Thursday', 'Rest', 'Rest', '0 min', '—', 'Recovery', '—', '—', 'Race Specific', 'Deload'],
    ['Friday', 'Rest', 'Rest', '0 min', '—', 'Full rest', '—', '—', 'Race Specific', 'Deload'],
    ['Saturday', 'Race Simulation', 'Simulation', '80 min', '8 km', 'Full sim: 8×(1km + station)', 'Race effort. This is your test.', 'All splits', 'Race Specific', 'Deload'],
    ['Sunday', 'Rest', 'Rest', '0 min', '—', 'Full rest after sim', '—', '—', 'Race Specific', 'Deload'],
    
    // ═══════════════════════════════════════
    // PEAK + TAPER (4 weeks)
    // ═══════════════════════════════════════
    ['Monday', 'Easy Run', 'Z2', '35 min', '5 km', 'Reduced volume', 'Stay loose', 'HR 130-145', 'Peak + Taper', 'Normal'],
    ['Tuesday', 'Light Strength', 'Strength', '30 min', '—', 'Movement only', '2 sets. Moderate loads. Neural activation.', '—', 'Peak + Taper', 'Normal'],
    ['Wednesday', 'Short Intervals', 'VO₂max', '30 min', '4 km', 'Stay sharp', 'WU 10 → 4×3min hard → CD 10', 'Intensity up, volume down', 'Peak + Taper', 'Normal'],
    ['Thursday', 'Easy / Rest', 'Z2', '30 min', '4 km', 'Very easy or rest', 'Listen to body', 'HR 130-140', 'Peak + Taper', 'Normal'],
    ['Friday', 'Rest', 'Rest', '0 min', '—', 'Full rest', '—', 'Stay off feet', 'Peak + Taper', 'Normal'],
    ['Saturday', 'Shakeout', 'Z2', '20 min', '3 km', 'Legs loose', 'Short strides at end', 'Feel fast, don\'t push', 'Peak + Taper', 'Normal'],
    ['Sunday', 'Rest', 'Rest', '0 min', '—', 'Full rest', 'Race week prep', 'Visualise, plan, sleep', 'Peak + Taper', 'Normal'],
  ];
  
  wpSheet.getRange(2, 1, wpData.length, wpData[0].length).setValues(wpData);
  
  // Format
  const wpHeaderRange = wpSheet.getRange(1, 1, 1, wpHeaders.length);
  wpHeaderRange.setFontWeight('bold').setBackground('#343A40').setFontColor('#60A5FA');
  wpSheet.setFrozenRows(1);
  wpSheet.setColumnWidth(1, 100);
  wpSheet.setColumnWidth(2, 240);
  wpSheet.setColumnWidth(3, 100);
  wpSheet.setColumnWidth(4, 90);
  wpSheet.setColumnWidth(5, 80);
  wpSheet.setColumnWidth(6, 280);
  wpSheet.setColumnWidth(7, 420);
  wpSheet.setColumnWidth(8, 280);
  wpSheet.setColumnWidth(9, 120);
  wpSheet.setColumnWidth(10, 100);
  
  // Color-code by zone
  const zoneColors = { 'Z2': '#D4EDDA', 'Threshold': '#FFF3CD', 'VO₂max': '#FDDEDE', 'Strength': '#D0E2FF', 'Simulation': '#E8DAEF', 'Rest': '#E9ECEF' };
  const zoneFontColors = { 'Z2': '#2D6A4F', 'Threshold': '#92400E', 'VO₂max': '#B91C1C', 'Strength': '#1D4ED8', 'Simulation': '#7B2CBF', 'Rest': '#6C757D' };
  
  for (let i = 0; i < wpData.length; i++) {
    const zone = wpData[i][2];
    const bg = zoneColors[zone] || '#F8F9FA';
    const fc = zoneFontColors[zone] || '#212529';
    const weekType = wpData[i][9];
    
    const range = wpSheet.getRange(i + 2, 1, 1, wpHeaders.length);
    range.setBackground(bg).setFontColor('#212529');
    wpSheet.getRange(i + 2, 3).setFontColor(fc).setFontWeight('bold');
    
    // Highlight deload weeks
    if (weekType === 'Deload') {
      wpSheet.getRange(i + 2, 10).setFontWeight('bold').setFontColor('#B91C1C');
    }
  }
  
  Logger.log('✅ WeeklyPlan tab created: ' + wpData.length + ' rows');
  
  // ═══════════════════════════════════════
  // TAB 2: StrengthA (unchanged from v1)
  // ═══════════════════════════════════════
  let saSheet = ss.getSheetByName('StrengthA');
  if (saSheet) ss.deleteSheet(saSheet);
  saSheet = ss.insertSheet('StrengthA');
  
  const strHeaders = ['Category', 'Exercise', 'Sets × Reps', 'Load', 'Tempo/Notes', 'HYROX Transfer', 'Progression', 'Alternatives'];
  saSheet.appendRow(strHeaders);
  
  const saData = [
    ['—', 'WEEK A (Horizontal Push Focus)', '', '', '', '', '', ''],
    ['LOWER PUSH (Main)', 'Hex Bar Squat', '3 × 5', '120–130 kg', 'Controlled eccentric, drive up', 'Sled push power, carry strength', '+2.5 kg/2 wk', 'Front squat, Goblet squat'],
    ['UPPER PUSH (Main)', 'DB Floor Press', '3 × 5', '28–30 kg', 'Pause at bottom', 'Wall balls, push capacity', '+2 kg when 3×5 clean', 'DB Bench, BB bench'],
    ['LOWER PUSH (Acc)', 'DB Lunges', '3 × 5/5', '28–30 kg', 'Full depth, drive through heel', 'Lunge station transfer', 'Add weight or tempo', 'Bulgarian, Reverse lunge'],
    ['POWER', 'DB Squat Jumps', '3 × 6', '16–22 kg', 'Reset each rep. Max height.', 'Explosive leg drive', '+2 kg when landing clean', 'Hex jumps, Box jumps'],
    ['CORE — Rotation', 'Cable Rotations', '3 × 8/8', '16–18 kg', 'Anti-rotation → rotation', 'Rotational stability', 'Progress load slowly', 'Med ball slams, Pallof press'],
    ['CALVES — Concentric', 'Standing Calf Raise', '3 × 6/6', '28–32 kg KB', 'Pause 2s top, 3s lower', 'Running efficiency', 'Add pause time', 'Leg press calf raise'],
    ['SPRINTS', '8-sec Sprints', '4 × 8s', 'BW', '52s rest between reps', 'Neural drive, speed', 'Vary: curve/flat/hill/sled', '—'],
    ['—', 'WEEK B (Vertical Push Focus)', '', '', '', '', '', ''],
    ['LOWER PUSH (Main)', 'Heavy Sled Push + Pull', '4 × 25m', '60–70 kg', 'Back and forward = 1 set', 'Direct sled transfer', '+5 kg/2 wk', 'Prowler, Heavy farmer walk'],
    ['UPPER PUSH (Main)', 'DB Push Press (1-arm)', '3 × 5/5', '22–26 kg', 'Explosive drive from legs', 'Wall balls, overhead', '+2 kg when clean', 'BB push press, Arnold press'],
    ['LOWER PUSH (Acc)', 'DB Lateral Lunge', '3 × 5/5', '22–26 kg', 'Full range, drive back', 'Multi-plane stability', 'Add x-over reverse lunge', 'Cossack squat'],
    ['POWER', 'Explosive Push-ups', '3 × 6', 'BW', 'Hands leave ground', 'Upper body power', 'Add deficit or clap', 'Plyo push-up, Med ball pass'],
    ['CORE — Stability', 'Plank / Walkouts', '2 × 45s', 'BW', 'Plank → side plank → walkout', 'Core brace under fatigue', 'Add shoulder taps', 'Ab wheel, Dead bugs'],
    ['CALVES — Isometric', 'Plantar Lunge Holds', '3 × 30s/side', 'BW', 'Deep lunge, lean forward', 'Achilles tendon strength', 'Increase hold time', 'Wall sit on toes'],
    ['SPRINTS', '8-sec Sprints', '4 × 8s', 'BW', '52s rest between reps', 'Neural drive, speed', 'Vary: curve/flat/hill/sled', '—'],
  ];
  
  saSheet.getRange(2, 1, saData.length, saData[0].length).setValues(saData);
  const saHeaderRange = saSheet.getRange(1, 1, 1, strHeaders.length);
  saHeaderRange.setFontWeight('bold').setBackground('#343A40').setFontColor('#60A5FA');
  saSheet.setFrozenRows(1);
  saSheet.setColumnWidth(1, 180); saSheet.setColumnWidth(2, 260); saSheet.setColumnWidth(3, 100);
  saSheet.setColumnWidth(4, 120); saSheet.setColumnWidth(5, 280); saSheet.setColumnWidth(6, 240);
  saSheet.setColumnWidth(7, 200); saSheet.setColumnWidth(8, 240);
  
  // Color categories
  const catBg = { 'LOWER': '#D0E2FF', 'UPPER': '#D0E2FF', 'POWER': '#FFE8CC', 'CORE': '#D0F0FD', 'CALVES': '#D4EDDA', 'SPRINTS': '#FDDEDE', '—': '#E2E8F0' };
  for (let i = 0; i < saData.length; i++) {
    const cat = saData[i][0];
    const key = Object.keys(catBg).find(k => cat.startsWith(k));
    saSheet.getRange(i + 2, 1, 1, strHeaders.length).setBackground(catBg[key] || '#F8F9FA').setFontColor('#212529');
    if (cat === '—') saSheet.getRange(i + 2, 1, 1, strHeaders.length).setFontWeight('bold');
  }
  Logger.log('✅ StrengthA tab created');
  
  // ═══════════════════════════════════════
  // TAB 3: StrengthB
  // ═══════════════════════════════════════
  let sbSheet = ss.getSheetByName('StrengthB');
  if (sbSheet) ss.deleteSheet(sbSheet);
  sbSheet = ss.insertSheet('StrengthB');
  
  sbSheet.appendRow(strHeaders);
  
  const sbData = [
    ['—', 'WEEK A (Horizontal Pull Focus)', '', '', '', '', '', ''],
    ['LOWER PULL (Main)', 'Hex Bar Deadlift', '3 × 5', '130–140 kg', 'Reset each rep. Brace hard.', 'Carry, sled posterior chain', '+2.5 kg/2 wk', 'Trap bar, Sumo DL'],
    ['UPPER PULL (Main)', 'KB Row (1-arm)', '3 × 6/6', '32 kg', 'Explosive pull, controlled lower', 'Rowing, rope pull', 'Progress to 36–40 kg', 'DB row, Cable row'],
    ['LOWER PULL (Acc)', 'KB Swing', '3 × 8', '32 kg', 'Hip snap. Arms are hooks.', 'Hip power all stations', 'Progress to 36–40 kg', 'DB swing, Band pull-through'],
    ['POWER', 'Cleans (vary position)', '3 × 5', '60–70 kg', 'Floor/shins/thighs', 'Full body explosive', '+2.5 kg/2 wk', 'DB snatch, Hang clean'],
    ['CORE — Rotation', 'Hurricane Med Ball Slams', '3 × 6/6', '16–20 kg', 'Full rotation, slam to side', 'Rotational power', 'Increase ball weight', 'Cable woodchop'],
    ['CALVES — Concentric', 'Seated Calf Raise', '3 × 8', '28–30 kg', 'Pause 2s top, 3s eccentric', 'Soleus for running', 'Progress load', 'Smith machine seated calf'],
    ['SPRINTS', '8-sec Sprints', '4 × 8s', 'BW', '52s rest between reps', 'Neural drive, speed', 'Vary: curve/flat/hill/sled', '—'],
    ['—', 'WEEK B (Vertical Pull Focus)', '', '', '', '', '', ''],
    ['LOWER PULL (Main)', 'Stiff-Legged Hex DL', '3 × 5', '100–120 kg', 'Slow eccentric, feel hamstrings', 'Posterior chain endurance', '+2.5 kg/2 wk', 'Romanian DL, SL DL'],
    ['UPPER PULL (Main)', 'Pull-ups (varied grip)', '3 × 6–8', 'BW +5 kg', 'Change grip each set', 'Ski erg, rope pull', 'Add weight at 3×8', 'TRX muscle-ups, Lat pulldown'],
    ['LOWER PULL (Acc)', 'Single Leg Ham Swing', '3 × 6/6', '14–16 kg', 'Stiff leg, feel stretch', 'Hamstring resilience', 'Add weight slowly', 'Ham sliders, Nordic curl'],
    ['POWER', 'DB Single Arm Snatch', '3 × 5/5', '20–24 kg', 'Floor to overhead, one move', 'Explosive pull', '+2 kg when clean', 'KB snatch, Hang snatch'],
    ['CORE — Stability', 'Farmer Carry / OH March', '3 × 40m', '32 kg / 2×12 kg', 'Alternate each set', 'Carry station transfer', 'Increase distance/load', 'Suitcase carry, Waiter walk'],
    ['CALVES — Isometric', 'Single Leg Wall Sit (toes)', '3 × 30s/side', 'BW', 'On toes, knee 90°', 'Tendon strength', 'Increase to 45s', 'ISO calf raise holds'],
    ['SPRINTS', '8-sec Sprints', '4 × 8s', 'BW', '52s rest between reps', 'Neural drive, speed', 'Vary: curve/flat/hill/sled', '—'],
  ];
  
  sbSheet.getRange(2, 1, sbData.length, sbData[0].length).setValues(sbData);
  const sbHeaderRange = sbSheet.getRange(1, 1, 1, strHeaders.length);
  sbHeaderRange.setFontWeight('bold').setBackground('#343A40').setFontColor('#60A5FA');
  sbSheet.setFrozenRows(1);
  sbSheet.setColumnWidth(1, 180); sbSheet.setColumnWidth(2, 260); sbSheet.setColumnWidth(3, 100);
  sbSheet.setColumnWidth(4, 120); sbSheet.setColumnWidth(5, 280); sbSheet.setColumnWidth(6, 240);
  sbSheet.setColumnWidth(7, 200); sbSheet.setColumnWidth(8, 240);
  
  const pullBg = { 'LOWER': '#D4EDDA', 'UPPER': '#D4EDDA', 'POWER': '#FFE8CC', 'CORE': '#D0F0FD', 'CALVES': '#D4EDDA', 'SPRINTS': '#FDDEDE', '—': '#E2E8F0' };
  for (let i = 0; i < sbData.length; i++) {
    const cat = sbData[i][0];
    const key = Object.keys(pullBg).find(k => cat.startsWith(k));
    sbSheet.getRange(i + 2, 1, 1, strHeaders.length).setBackground(pullBg[key] || '#F8F9FA').setFontColor('#212529');
    if (cat === '—') sbSheet.getRange(i + 2, 1, 1, strHeaders.length).setFontWeight('bold');
  }
  Logger.log('✅ StrengthB tab created');
  Logger.log('🎉 All training plan tabs v2 created!');
}

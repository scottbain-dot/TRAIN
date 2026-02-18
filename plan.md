# Data Quality Fix Plan — HYROX ENGINE

## Overview
Two-layer approach: **frontend hardening** (index.html — I build and push) + **Apps Script fixes** (I provide code, you deploy). Frontend fixes first so the app works better immediately with current data. Apps Script fixes second to stop bad data at the source.

---

## PHASE 1: Frontend Hardening (index.html)

### 1.1 — Fix cross-date workout duplicates
**Problem:** Feb 10/11 have identical workouts. Current dedup only matches within same date.
**Fix:** After per-date dedup, add a second pass that removes workouts with identical (Type + Duration + Distance + Calories + AvgHR) across different dates, keeping the earliest occurrence.

### 1.2 — Improve duration seconds→minutes correction
**Problem:** Rowing/strength entries with no distance and low calories slip through the current checks. E.g. Rowing 212 min with 95 cal = 0.45 cal/min (current threshold is 1.5 but only triggers when dur > 60).
**Fix:** Lower the calorie-rate threshold and remove the `dur > 60` guard. Also add a third check: if duration > 120 and no distance, check if dur/60 produces a more realistic calorie rate — if so, convert.

### 1.3 — Filter absurd pace from calculations (not just display)
**Problem:** Pace > 600 sec/km is filtered in History display but still feeds into aerobic efficiency and volume calculations.
**Fix:** When computing aerobic metrics, skip workouts where pace > 900 sec/km (15 min/km). Also skip pace values from non-running workout types entirely.

### 1.4 — Sanitize Walking HR
**Problem:** Feb 3 has Walking HR = 17,894.
**Fix:** In the DailyMetrics aggregation, add bounds checking: Resting HR 30-120, HRV 1-250, Walking HR 40-200. Discard values outside these ranges.

### 1.5 — Filter distance on non-distance workout types
**Problem:** Feb 6 FST shows 8 km. Strength training shouldn't have meaningful distance.
**Fix:** Zero out distance for workout types that don't produce distance: Functional Strength Training, Traditional Strength Training, Rowing, Stair Climbing, Elliptical, Indoor Cycling, Yoga.

### 1.6 — Add data freshness detection
**Problem:** Steps/Calories dropped to near-zero after Feb 10 (possible script breakage) but the app doesn't surface this.
**Fix:** Compare the latest 3 days of steps to the 14-day average. If latest is < 20% of average, show a warning banner: "Recent health data looks incomplete — check Health Auto Export sync."

### 1.7 — Remove debug logging before merge
**Problem:** Sleep debug logs from previous commits are useful now but shouldn't ship long-term.
**Fix:** Keep the `[Readiness Debug]` log (useful) but remove the verbose sleep column header logging added in the diagnostic commit. Convert to a single compact debug line.

---

## PHASE 2: Apps Script Fixes (I write code, you deploy)

### 2.1 — Fix sleep parsing in doPost
**Problem:** HAE sends overlapping sleep stage intervals. Script writes raw fragments that sum to 35+ hours.
**Fix:** In `doPost`, when processing sleep data:
- Look for "Sleep Analysis" or "sleepAnalysis" in the payload
- Calculate total sleep = sum of (Asleep + Core + Deep + REM) durations, excluding "In Bed"
- Convert to hours, write single value to "Sleep Duration (hr)"
- Write Deep and REM totals separately
- Reject values > 16h or < 0.5h

### 2.2 — Fix duration at ingestion
**Problem:** HAE sometimes sends workout duration in seconds.
**Fix:** In `doPost`, apply the same pace/calorie heuristics before writing to the sheet. If duration seems to be in seconds, divide by 60 before inserting.

### 2.3 — Fix Start/End time parsing
**Problem:** All timestamps show 12/30/1899.
**Fix:** Parse the ISO 8601 timestamps from HAE (`2026-02-10T07:30:00+00:00`) into Google Sheets date objects using `new Date(isoString)` before writing.

### 2.4 — Add cross-sync deduplication
**Problem:** HAE re-syncs cause same workout on multiple dates.
**Fix:** Before inserting a workout, check if a row already exists with same Type + Duration (±5%) + Calories (±10%) + AvgHR (±2) within ±1 day. Skip if found.

### 2.5 — Fix daily metrics fragmentation
**Problem:** HAE sends partial rows (one metric per POST) creating sparse fragments.
**Fix:** Instead of appending a new row per POST, find today's row and UPDATE it (merge non-empty values). Only append if no row for today exists yet.

---

## Execution Order
1. Phase 1 (1.1 → 1.6) — I implement all in index.html, commit, push
2. You merge PR and verify on live site
3. Phase 2 — I provide complete Apps Script code
4. You deploy to Apps Script and run consolidation
5. We verify data quality improves over next 24-48h

---

## What This Won't Fix
- **Weight data:** Not being sent by Health Auto Export. You'd need to enable "Weight" in HAE export settings, or manually enter in the sheet.
- **Elevation data:** Apple Watch may not be recording this for indoor workouts. Only useful for outdoor runs.
- **Source column:** Not critical — can ignore or remove from sheet.
- **Historical bad data already in sheet:** Frontend fixes will filter it client-side. We could also write a one-time cleanup Apps Script function.

# HYROX ENGINE (TRAIN)

## Project Overview
A personal fitness tracking web app for HYROX race preparation. Displays real-time health/training data pulled from Apple Watch via Google Sheets, with Oura/WHOOP-inspired design and actionable insights.

**Live URL:** https://scottbain-dot.github.io/TRAIN/
**GitHub:** https://github.com/scottbain-dot/TRAIN

## Owner
- **Name:** Lad (Scott Bain)
- **Age:** 42
- **Goal:** HYROX race time of 1:05:00 (PB: 1:17:18)
- **Apple Watch user** — all health data flows from watch

## Architecture

```
Apple Watch → Apple Health → Health Auto Export app ($3/mo)
    → POST JSON every 15 min → Google Apps Script (web app endpoint)
    → Parses & writes to Google Sheets
    → HYROX ENGINE frontend reads via Google Sheets public viz API
```

### Frontend
- **Single `index.html` file** — self-contained with embedded CSS and JS
- Uses React via CDN (no build step)
- Inter font from Google Fonts
- Dark theme with Oura-style gradient modals and aurora effects
- Hosted on GitHub Pages
- PWA-capable (add to home screen on iPhone)

### Data Backend
- **Google Sheet ID:** `1BlGGukORumWb7508lcu-SS0wF8lMwdOJEsOp-vGCKrc`
- Sheet name: "HYROX ENGINE Data"
- Sheet is published to web (File → Share → Publish to web) for public read access
- Data fetched client-side using Google Sheets visualization API (no API key needed)

### Google Apps Script
- Located in: HYROX ENGINE Data spreadsheet → Extensions → Apps Script
- Deployed as Web App (Execute as: owner, Access: Anyone)
- Receives POST JSON from Health Auto Export
- Parses workout data and daily health metrics
- Writes to appropriate sheet tabs
- Includes deduplication logic and sync logging

## Google Sheets Structure

### Workouts Tab
| Column | Content |
|--------|---------|
| Date | Workout date |
| Type | e.g. Running, Traditional Strength Training, Functional Strength Training |
| Duration (min) | Duration in minutes |
| Distance (km) | Distance in km (empty for non-distance workouts) |
| Calories | Active calories |
| Avg HR | Average heart rate (bpm) |
| Max HR | Maximum heart rate (bpm) |
| Avg Pace (sec/km) | Pace in seconds per km |
| Start Time | ISO timestamp |
| End Time | ISO timestamp |

**Known issues:**
- Duplicate rows can appear when Health Auto Export re-syncs — a `consolidateWorkouts()` function exists in Apps Script to deduplicate
- Non-running workouts (strength, functional) have no distance data, which causes volume calculations to show 0 if only these are recent
- Avg Pace values can be wildly high (30750 sec/km) for non-distance workouts — filter these out

### DailyMetrics Tab
| Column | Content |
|--------|---------|
| Date | Date |
| Resting HR | Resting heart rate (bpm), range ~52-64 |
| HRV | Heart rate variability (ms), single overnight reading, range ~34-78 |
| VO2 Max | Apple Watch VO₂max estimate, range ~42-44 |
| Sleep Duration (hr) | **Currently mostly empty** — sleep data from Health Auto Export not reliably mapping |
| Deep Sleep (hr) | Currently empty |
| REM Sleep (hr) | Currently empty |
| Walking HR | Walking average HR |
| Steps | Daily steps |
| Active Calories | Daily active calories |

**Sleep data issue:** Apple Health stores sleep as intervals (In Bed, Asleep, Core, Deep, REM). Health Auto Export sends "Sleep Analysis" but it's not reliably converting to duration hours. This is an ongoing issue.

## App Features & Tabs

### Home Tab
- **Today's Session** — planned workout for the day with click-through for detail
- **4 Metric Cards** (Oura-style, tappable → modal with contributing factors):
  1. **Readiness** — Can you train hard today? (Resting HR vs 7-day avg, HRV vs 7-day avg, HRV stability, sleep, yesterday's load, ACWR)
  2. **Aerobic Engine** — VO₂max progress, weekly volume trend, aerobic efficiency (pace:HR ratio), long run consistency
  3. **Race Prediction** — Predicted HYROX finish time based on Brownlee-adapted model using VO₂max, training volume, simulation performance
  4. **HYROX Readiness** — Station-specific preparedness (sled, wall balls, ski erg, etc.)
- **Weekly Volume** bar/progress indicator

### Plan Tab
- Periodized training plan (14-month build to target race)
- Current phase highlighted
- Weekly session breakdown
- Auto-checked workouts (matched from actual workout data)

### History Tab
- Workout log with filtering (All, Running, Strength, etc.)
- Date, type, duration, distance, HR data

## Scoring Algorithms

### Readiness Score (0-100)
- HR Component (0-30): Resting HR vs 7-day rolling average
- HRV Component (0-30): HRV vs 7-day avg + coefficient of variation (stability)
- Sleep Component (0-20): Duration + 3-day sleep debt
- Load Component (0-20): ACWR (acute:chronic workload ratio) + yesterday's load

### Aerobic Engine Score (0-100)
- VO₂max component (0-40): Progress from baseline 43.5 → target 48
- Volume component (0-30): Weekly km vs 50km/week target
- Efficiency component (0-20): Pace:HR ratio trend at Z2
- Consistency component (0-10): Long runs in last 4 weeks

### Training Load (TRIMP-based)
- Uses duration × avg HR zone intensity factor
- ACWR = 7-day acute load ÷ 28-day chronic load
- Sweet spot: 0.8-1.3

## Key Performance Targets
| Metric | Current | Target |
|--------|---------|--------|
| Race time | 1:17:18 PB | 1:05:00 |
| VO₂max | ~42-44 | 48 |
| Weekly volume | varies | 50 km/week |
| Z2 pace | TBD | improving trend |

## Design System
- **Theme:** Dark (#000000 or #0a0a0a background)
- **Cards:** #111111 or #141414 with subtle borders (rgba(255,255,255,0.06-0.08))
- **Font:** Inter (300-700 weights)
- **Colors:**
  - Green: #30D158 (good/optimal)
  - Blue: #0A84FF
  - Orange: #FF9F0A (caution)
  - Red: #FF453A (concern)
  - Purple: #BF5AF2
  - Cyan: #64D2FF
  - Yellow: #FFD60A
- **Gradients for modals:**
  - Readiness: blue-dark (linear-gradient 135deg, #1e3a5f → #0a141f)
  - Aerobic: green-dark (#1a4d3a → #091a14)
  - Race: amber-dark (#4a3519 → #1a140a)
  - HYROX: purple-dark (#3d1a5c → ...)
- **Components:** ProgressRing (SVG circular), ContributorBar (horizontal bar with score), modal sheets (bottom-up with handle)
- **Style:** Oura Ring / WHOOP inspired — clean, premium, data-rich but not cluttered
- PWA meta tags for iOS home screen

## Data Fetching Pattern
```javascript
// Google Sheets visualization API (no auth needed if sheet is published)
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
const response = await fetch(url);
const text = await response.text();
// Response is wrapped in google.visualization.Query.setResponse({...})
const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(({.*})\)/s)[1]);
```

**Critical date parsing note:** Google Sheets viz API returns dates as `Date(2025,0,15)` (month is 0-indexed). Must parse correctly.

## Deployment
1. Edit `index.html` locally or via Claude Code
2. Commit and push to `main` branch
3. GitHub Pages auto-deploys from root of `main`
4. Changes live within 1-2 minutes

## Common Tasks
- **Fix data display bug:** Usually a column header mismatch between what the app expects and what's in the sheet
- **Add new metric card:** Follow existing pattern — card on home, modal with ContributorBar components, scoring function
- **Update training plan:** Modify the plan data object in the Plan tab section
- **Debug data flow:** Check SyncLog sheet in Google Sheets, check browser console for fetch errors

## Important Context
- This is a personal project — only one user (Lad)
- All data is from Apple Watch via Health Auto Export
- The app should look and feel like a premium fitness app (Oura, WHOOP quality)
- Lad is not a developer by trade but is comfortable with HTML/JS and Google Apps Script
- When making changes, always produce a complete working `index.html` file that can be pushed directly to GitHub

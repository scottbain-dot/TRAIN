# HYROX ENGINE — Architecture & Reference Document
## Last updated: March 29, 2026

---

## Overview

The HYROX ENGINE is a single-file web app (index.html) for HYROX race training, built for Scott (Lad) Bain, a PE teacher and competitive HYROX athlete targeting the April 2027 race in Malaga. The app is hosted at `scottbain-dot.github.io/TRAIN/`.

**Stack:** React 18 + Babel (in-browser), single HTML file, no build step.
**Data:** Google Sheets via gviz API (read), Apps Script (write), localStorage (cache).
**Deployment:** GitHub Pages. Push `index.html` to the `TRAIN/` directory.

---

## Data Pipeline

### Health Data (Read-Only)
```
Apple Watch → Apple Health → Health Auto Export app → Google Sheets → gviz API → App
```

**Workouts Sheet:** `1r-IO6Ce-uKJ6SYuEz1IiapHniosIKoyPUwkpGzR3dlM` tab `Workouts-2026`
- Columns: Type, Start, End, Duration, Energy, Max HR, Avg HR, Distance, Speed, Steps, Cadence, Flights, Elevation
- Duration arrives as `Date(1899,11,30,H,M,S)` format — parsed in `fetchSheet` function
- Dates arrive as `Date(YYYY,M,D)` (0-indexed months) — converted to `YYYY-MM-DD` using `localDateStr()` to avoid UTC timezone shift

**Daily Metrics:** Monthly sheets `HealthMetrics-YYYY-MM` with tabs like `HealthMetrics-2026-01`
- Columns: RHR, HRV, Sleep (total/deep/REM/core/awake), VO2 Max, Running Power/Stride/GCT, Respiratory Rate
- Multiple sheet IDs configured in `CONFIG.dataSources.daily.sheets`

### App Data (Read/Write)
```
App → localStorage (instant) + Apps Script → Google Sheet "AppData" tab (cloud)
```

**Apps Script URL:** `https://script.google.com/macros/s/AKfycbxL78wqm7aH8kKgj0Sqzh0LnpXSRyOMAVpNszzA_yPgpsIArMeiX3CBn4EomyWYztuP/exec`

**Storage keys:**
- `zones` — HR zone data per workout (key: `date|type|duration`)
- `training_journal` — Array of journal entries for AI coach context
- `tests` — Performance test results (2km TT, threshold, mini-sim)
- `threshold_tests` — Threshold speed test results for pace progression
- `done_YYYY-MM-DD` — Weekly session checklist state (keyed by Monday date)

**Cloud sync:** On app load, `storage.syncFromCloud()` pulls all keys from AppData tab → updates localStorage. Every `storage.set()` writes to both localStorage and cloud.

### AI Coach Proxy
```
App → POST to Apps Script → Anthropic API → Response back
```
The Apps Script `doPost` function proxies requests to Claude's API with the API key stored server-side.

---

## Key Configuration (CONFIG object)

### HR Zones (matched to Apple Watch automatic zones)
| Zone | BPM | % of 183 maxHR |
|------|-----|----------------|
| Z1 | <129 | <70.5% |
| Z2 | 130-141 | 71-77% |
| Z3 | 142-153 | 78-84% |
| Z4 | 154-165 | 84-90% |
| Z5 | 166+ | 90%+ |

**Max HR:** 183 (observed in HYROX race)
**Resting HR:** ~55

### Session HR Targets
- Z2 Stepper: 135 bpm (130-141)
- Z2 Run: 138 bpm (130-141)
- Threshold: 160 bpm (154-165)
- VO2max: 172 bpm (166-183)
- Strength: variable (100-150)

### Threshold Progression Targets (path to 4:00/km by November 2026)
Mar: 11.0 → Apr: 11.5 → May: 12.0 → Jun: 12.5 → Jul: 13.0 → Aug: 13.5 → Sep: 14.0 → Oct: 14.5 → Nov: 15.0 km/h

**Current benchmarks (Mar 29, 2026):**
- Treadmill threshold: 11.5 km/h (5:13/km)
- Bike threshold: 250W at 95 RPM
- VO2max pace (regular treadmill): 14-14.7 km/h
- VO2max pace (curve treadmill): 12-13 km/h
- Sprint power: ~1100W fatigued on watt bike
- VO2max: 45.4

---

## Training Plan

### Periodization Phases
| Phase | Start | Weeks | Focus |
|-------|-------|-------|-------|
| Base 2 | 2026-02-24 | 8 | Volume + Threshold |
| Build 1 | 2026-04-21 | 8 | VO2max + Threshold |
| Build 2 | 2026-06-16 | 8 | Peak Volume + Specificity |
| Build 3 | 2026-08-11 | 8 | Sustained Peak + Race Prep |
| Race Specific | 2026-10-06 | 8 | HYROX-Specific |
| Peak + Taper | 2026-12-01 | 4 | Taper to A-Race |

### Training Cycle
- **5-week cycle:** 4 weeks building + week 5 deload
- **Week A/B alternation:** Only affects one weekend session (threshold week vs compromised running week)
- Both Strength A and B are done every week regardless of A/B designation

### Weekly Session Structure (Base 2)
Sessions are not assigned to fixed days — athlete arranges around schedule.

**Every week:**
1. Strength A: Push (weekday gym) — 60min
2. Strength B: Pull (weekday gym) — 60min
3. Threshold (weekday gym) — 45min, bike/rower/treadmill
4. Z2 Stepper (any gym) — 50min
5. Weekend session: Z2 Long Stepper (Week A) OR Compromised Running (Week B)
6. VO2max Intervals (weekend gym) — 35min
7. Flex: Z2 or Off (optional)

**Equipment constraints:**
- Weekday gym: treadmill, watt bike, spin bike, rower, stepper, curve treadmill, free weights/cables
- Weekend gym: + ski erg, sled, all HYROX stations
- HYROX-specific work (compromised running, sled, ski erg) → weekends only

### Deload Week Structure
1. Strength A light (2 sets per exercise)
2. Strength B light (2 sets per exercise)
3. Threshold Test (20min benchmark on treadmill)
4. Z2 Stepper (30min)
5. Off or easy walk

### Strength Sessions

**Strength A: Push**
- Hex Bar Squat: 3×5 @ 125kg
- DB Floor Press: 3×5 @ 30kg
- DB Lunges: 3×5/5 @ 28kg
- DB Squat Jumps: 3×6 @ 18kg
- Cable Rotations: 3×8/8 @ 16kg
- Standing Calf Raise: 3×6/6 @ 30kg
- 8s Sprints: 4×8s

**Strength B: Pull**
- Hex Bar Deadlift: 3×5 @ 135kg (topped 145×5)
- KB Row: 3×6/6 @ 32kg
- KB Swing: 3×8 @ 32kg
- Cleans: 3×5 @ 65kg (done at 60kg recently)
- Hurricane Med Ball Slams: 3×6/6 @ 18kg
- Seated Calf Raise: 3×8 @ 28kg
- 8s Sprints: 4×8s

---

## App Architecture

### Tabs
1. **Home** — Dashboard: readiness, aerobic engine, race fitness, threshold progression, HR zones, training load, race countdown
2. **Plan** — Current phase, weekly session checklist (tap circle to complete), phase overview
3. **Coach** — AI chat interface with training journal, routes through Apps Script proxy
4. **History** — Workout log with zone entry, VO2max chart, weekly volume, insights

### Design System
- **Theme:** Light (#F5F3EF background, #FFFFFF cards)
- **Font:** DM Sans (300-700 weights) + DM Serif Display for hero values
- **Colors:**
  - Green: #34A853 (good/optimal)
  - Blue: #4285F4
  - Orange: #E8710A (caution)
  - Red: #D93025 (concern)
  - Purple: #9334E6
  - Cyan: #0097A7
  - Yellow: #E5A100
- **Gradients:** Subtle pastel gradients for metric cards (readiness: blue, aerobic: green, race: amber, hyrox: purple)
- **Components:** ProgressRing (SVG circular), ContributorBar (horizontal bar with score), modal sheets (bottom-up with handle), InsightBox, StatBox
- **Style:** Oura Ring / WHOOP inspired — clean, premium, data-rich but not cluttered
- **No emojis** in session cards, plan cards, or modals
- PWA-capable (add to home screen on iPhone)

### Key Components
- `SessionCard` — Displays session details with HR targets
- `SessionModal` — Full session detail on tap (exercises, structure, targets)
- `ZoneEntryModal` — Enter HR zone minutes per workout (stored in cloud)
- `ReadinessModal`, `AerobicModal`, `RaceFitnessModal`, `HyroxReadyModal`, `VolumeModal`
- `TestModal` — Log performance tests
- `TimeToggle` — Range selector (3M/6M/Y/All or week/phases)
- `StatBox`, `InsightBox`, `LineChart`, `BarChart` — UI primitives

### Key Functions

**Data:**
- `fetchSheet(sheetId, tab)` — Fetches Google Sheet via gviz JSON API, handles Date() format parsing
- `localDateStr(date)` — Converts Date to `YYYY-MM-DD` without UTC timezone shift
- `parseNum(v)` — Parses number handling both comma and dot decimal separators (German locale)

**HR Engine (`hrEngine` object):**
- `classify(hr)` — Returns zone number (1-5) for a given HR
- `classifyWorkout(workout)` — Classifies workout by zone, handles strength reclassification for high-HR sessions
- `trimp(workout, restHR)` — Banister TRIMP: `dur × ΔHR × 0.64 × e^(1.92 × ΔHR)`
- `acwr(workouts, restHR)` — Acute:Chronic Workload Ratio (7-day vs actual-days chronic)
- `weeklyZones(workouts)` — Zone distribution with manual zone data priority, Max/Avg HR estimation fallback
- `paceHRCoupling(workouts)` — Aerobic efficiency trending (Z2 runs only, >3km >20min)
- `weeklyZoneTrend(workouts)` — 4-week zone distribution visualization
- `sessionRecommendation(readiness, acwr, yesterdayZone)` — Readiness-based intensity recommendation
- `driftCheck(workouts)` — Cardiac efficiency trending (avg HR in Z2 over time)
- `sessionTargets(sessionType)` — Returns HR targets for a session type

**Readiness Score (0-100):**
- HR component (0-25): Resting HR vs 7-day avg (lower = better)
- HRV component (0-30): HRV Balance — 14-day weighted avg vs 60-day baseline, with 3-day trend
- Sleep component (0-25): Duration-based
- Training load component (0-20): Yesterday's TRIMP vs 7-day average
- Labels: peak (85+), good (70-84), moderate (55-69), low (40-54), rest (<40)

**Zone Distribution:**
Priority order for zone data per workout:
1. Manual zone data from cloud storage (Z1-Z5 min entered by user)
2. Estimated split using Max HR vs Avg HR spread (>15bpm spread = interval session)
3. Single zone classification from Avg HR

**Workout Classification:**
- Walks < 25min → Z1/walk
- Duration < 3min → Z1/micro
- Strength sessions → 'str' category UNLESS avgHR > 145 and dur > 20min (reclassified as cardio, e.g. HYROX sim)
- Cardio → classified by HR zone
- No HR → estimated by workout type

### AI Coach

**System prompt includes:**
- Live data: readiness, zones, ACWR, phase, completed sessions, recent workouts
- Training journal: persistent entries logged from coach conversations
- Full training history: threshold/VO2max progression, strength benchmarks, injury history
- Training philosophy: 80/20 polarized, equipment constraints, monthly targets

**Journal auto-logging:**
Coach responds with `<journal>{"type":"session","workout":"...","notes":"..."}</journal>` tags that the app parses and stores. Types: session, injury, plan, benchmark, note.

**Pre-seeded with 15 entries** covering Feb-Mar 2026 training history from coaching conversations.

---

## Known Issues & Gotchas

1. **Health Auto Export stops syncing** if the app isn't opened periodically. Background refresh must be enabled in iOS Settings.

2. **Apps Script POST redirect:** Google Apps Script redirects POST requests (302). The fetch uses `redirect: 'follow'` — if CORS issues occur, may need alternative approach.

3. **Apps Script GET for writes:** POST as GET with `payload` parameter is the proven pattern for Apps Script to avoid 302 redirect failures. Currently using GET for storage operations.

4. **German locale decimals:** Input fields may show commas instead of dots. `parseNum()` handles both.

5. **Duplicate workout keys:** Same workout type on same day (e.g. two "Indoor Run" entries) — zone storage uses `date|type|duration` as key to differentiate.

6. **Session checklist resets weekly:** Keyed by Monday date. State persists in cloud storage.

7. **gviz Date format:** Duration = `Date(1899,11,30,H,M,S)`, Dates = `Date(YYYY,M,D)` where months are 0-indexed.

---

## Deployment

1. Edit `index.html` locally or via Claude Code
2. Commit and push to `main` branch
3. GitHub Pages auto-deploys from root of `main`
4. Changes live within 1-2 minutes

## Common Tasks

- **Fix data display bug:** Usually a column header mismatch between what the app expects and what's in the sheet
- **Add new metric card:** Follow existing pattern — card on home, modal with ContributorBar components, scoring function
- **Update training plan:** Modify the plan data object in the `getWeekPlan()` function
- **Debug data flow:** Check SyncLog sheet in Google Sheets, check browser console for `[Data Load]`, `[Workout Sample]`, `[TRIMP Debug]`, `[Zone Distribution]`, `[Zone Details]` logs

---

## Athlete Context

**Scott (Lad) Bain**
- PE teacher at Frankfurt International School
- Based in Germany (CET timezone)
- HYROX personal best: 1:17:18, target: 1:05:00
- Target race: Malaga, April 2027
- Recurring calf tightness — avoid back-to-back heavy legs + running
- Was sick Mar 17-23 (forced deload)
- Training at two gyms: weekday (no HYROX stations) and weekend (full setup)
- Hilly forest running near home (Oberursel area, 133m elevation gain typical)
- Not a developer by trade but comfortable with HTML/JS and Google Apps Script
- When making changes, always produce a complete working `index.html` file

**Three levers for 4:00/km:**
1. Z2 volume (50%) — stepper for zero-impact aerobic base
2. VO2max ceiling (30%) — weekly intervals, progressive overload
3. Running economy (20%) — strides, threshold treadmill, hill sprints

---

## Future: Native iOS App

Spec document created (`hyrox-engine-ios-spec.md`). Key motivations:
- Direct HealthKit access (raw HR samples every 3-5s, proper time-in-zone)
- No middlemen (Health Auto Export, Google Sheets, gviz API)
- iCloud sync between devices
- Cost: €99/year Apple Developer account
- Build: Swift + SwiftUI + HealthKit + CoreData
- Same training logic, clean data pipeline

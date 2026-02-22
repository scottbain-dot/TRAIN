# HYROX ENGINE — Training Plan v2

## Athlete Profile
- Age: 42, PB: 1:17:18, Target: 1:05:00
- A-Race: HYROX Malaga, Mid-April 2027
- Current VO₂max: ~44, Target: 48-50
- Current threshold: ~5:00/km, Target: 4:15-4:20/km

## Phase Structure (6 phases)

| Phase | Weeks | Dates | Volume (km/wk) | Focus |
|-------|-------|-------|-----------------|-------|
| Base 1 | 8 | Feb 10 – Apr 5 | 25→35 | Aerobic foundation, progressive runs, strides |
| Base 2 | 8 | Apr 7 – Jun 1 | 35→45 | Threshold + compromised running (alternating), VO₂max begins |
| Build 1 | 8 | Jun 2 – Jul 26 | 45→55 | VO₂max development, threshold/compromised alternating |
| Build 2 | 8 | Jul 28 – Sep 20 | 50→60 | Peak volume, engine building |
| Race Specific | 8 | Sep 22 – Nov 15 | 50 | Compromised running every week, simulations |
| Peak + Taper | 4 | Nov 17 – Dec 15 | 45→25 | Cut volume, maintain intensity |

## 4-Week Training Cycle
- Weeks 1-3: Normal training
- Week 4: Deload/test (60% volume)
  - Wednesday: 2km TT or 20min threshold test (alternating)
  - Saturday: Mini-sim test — 4×(1km + station)
  - Strength: 2 sets per exercise (reduced from 3)

## Week A / Week B Alternation (Base 2 onward)
- Week A (even weeks): Pure running threshold on Wednesday — clean data for tracking
- Week B (odd weeks): Compromised running — 4×(1km threshold + station)
- Race Specific phase: compromised running EVERY Wednesday regardless of A/B

## Station Priority (for compromised running)
1. Ski Erg (weakest station)
2. Sled Push (strong but high HR cost)
3. Rowing (technique work)
4. Farmer Carry (calf endurance under fatigue)
5. Wall Balls, Lunges, Sled Pull, Burpees (rotate in — these are strengths)

## Weekly Templates

### Base 1 (Normal)
- Mon: Easy Run 50min Z2
- Tue: Strength A — Push (see StrengthA tab)
- Wed: Progressive Run (35min easy → 15min tempo)
- Thu: Easy Run 45min + 6×30s strides
- Fri: Strength B — Pull (see StrengthB tab)
- Sat: Long Run 75→90min Z2
- Sun: Rest

### Base 2+ (Normal — Week A)
- Mon: Easy Run 50min Z2
- Tue: Strength A — Push
- Wed: Running Threshold (WU 10 → Tempo 20min → CD 10)
- Thu: Easy Run 45min + strides
- Fri: Strength B — Pull
- Sat: Long Run 90→120min Z2
- Sun: VO₂max Intervals (4-5×3-4min hard, 3min jog)

### Base 2+ (Normal — Week B)
- Same as Week A except:
- Wed: Compromised Running — 4×(1km threshold + station)

### Race Specific (Normal)
- Mon: Easy Run 45min
- Tue: Strength A (reduced — 2 sets)
- Wed: Compromised Running every week
- Thu: Easy Run 45min
- Fri: Strength B (reduced — 2 sets)
- Sat: Long Run (Wk A) or Race Simulation (Wk B)
- Sun: VO₂max sharp session (6×2min hard)

### Deload/Test Week (all phases)
- Mon: Easy Run 30min
- Tue: Strength A light (2 sets)
- Wed: TEST — 2km TT or 20min threshold test
- Thu: Rest
- Fri: Strength B light (2 sets)
- Sat: TEST — Mini-sim 4×(1km + station) or easy run (Base 1)
- Sun: Rest

## Strength Structure (Tue + Fri)
- Push day (Tue) and Pull day (Fri)
- Each alternates Week A (horizontal focus) / Week B (vertical focus)
- Every session: Main lift + Accessory + Power + Core + Calves + 4×8s sprints
- Race phases: reduced to 2 sets per exercise
- See StrengthA and StrengthB tabs in Google Sheet for full exercise details

## Google Sheet Integration
- App reads WeeklyPlan, StrengthA, StrengthB tabs from the HYROX_ENGINE_Data sheet
- Falls back to hardcoded plans if tabs don't exist
- Edit exercises, weights, progressions directly in the sheet
- CreatePlanTabs_v2.js creates/replaces these tabs via Apps Script

## Testing Protocol
- Tests occur in deload weeks (every 4th week)
- 2km TT: Measures VO₂max progress (target: 9:00 → 7:30-7:45)
- 20min Threshold: Measures threshold pace (target: 5:00/km → 4:15-4:20/km)
- Mini-Sim: 4×(1km + station) — measures pace decay and station efficiency
- Rotate station focus each test: ski erg → sled push → rowing → farmer carry

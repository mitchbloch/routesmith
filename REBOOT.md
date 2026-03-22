# Routesmith — Reboot Script

## 1. Project Goals

Exercise route generator (run/walk/bike). User picks start location on Mapbox map → 6-step wizard (activity, route type, distance, elevation, scenery, safety) → server generates 3 scored routes via Mapbox Directions + OSM Overpass → display on map → save/rate/share from localStorage. No DB, no auth for MVP.

**PRD**: `routesmith/PRD.md`
**Stack**: Next.js 16 App Router, TS, Tailwind, Mapbox GL JS, Overpass API, lz-string sharing, localStorage persistence.

## 2. Current State

### What We Were Working On
**Tuning the route selection/ranking algorithm via RLHF (human feedback).** We completed all Quick Wins and Stretch Goals, then moved to algorithm improvements. We were about to start iterative feedback rounds where the user generates routes, evaluates results, and we tune scoring weights accordingly.

### Build State
- **`npm run build` passes clean** ✅
- **`npm run lint`** has 5 pre-existing errors (all `set-state-in-effect` warnings in files from MVP phases) + 1 unused import warning. None are from recent changes.
- **App runs on `npm run dev` at localhost:3000** ✅

## 3. What's Done

### MVP (8 phases — all complete)
- Full app: landing → wizard → route generation → results → detail → save/share/library
- See "Completed Milestones" section below for details

### Quick Wins (all complete)
- **`loading.tsx` skeleton files** — `results/`, `route/[id]/`, `library/`, `wizard/` — Tailwind `animate-pulse` placeholders
- **`error.tsx` error boundaries** — root, `results/`, `route/[id]/`, `wizard/`, `library/` — `'use client'` with `{error, reset}`, recovery buttons, uses `<Link>` not `<a>`
- **Mobile responsive polish** — results map `h-[35vh] sm:h-[40vh]`, cards `pb-20`, route detail map `h-[40vh] sm:h-[50vh]`, panel `p-4 sm:p-6`, stats `gap-2 sm:gap-4` / `p-2 sm:p-3` / `text-base sm:text-lg`

### Stretch Goals (all complete)
- **SSR OpenGraph meta tags** — `route/[id]/layout.tsx` with `generateMetadata()`, decompresses lz-string from `searchParams?.data` (note: optional chaining required — was a bug fix). Root layout has OG defaults + twitter card
- **PWA manifest + icons** — `public/manifest.json`, 4 PNG icons (192/512 regular + maskable), root layout has `<link rel="manifest">`, `theme-color`, `apple-touch-icon`
- **Reverse geocoder** — `src/lib/geocoding.ts` with `reverseGeocode(lat, lng)` via Mapbox Geocoding API. Landing page resolves map clicks to addresses. Wizard destination picker also uses it.
- **P2P destination picker** — Wizard shows 7th step (step 3) when Point-to-Point selected, with Map + AddressSearch + reverse geocoding. Uses `getLogicalStep()` mapping function. Clears cached routes on finish.
- **Real elevation** — `src/lib/elevation.ts` with distance-based sampling (~0.1mi intervals, 5-80 samples clamped). Mapbox Tilequery API with heuristic fallback. Applied to both loop and P2P in `routeGenerator.ts`.

### Algorithm Improvements (all complete, tuning in progress)
1. **Hard distance filter** — Routes outside user's range (5% tolerance) are filtered out before ranking. Fallback picks closest-to-range if nothing passes.
2. **Wider candidate net** — 12 candidates (3 distance targets × 4 bearings) instead of original 6. Distance targets are p25/p50/p75 of user's range.
3. **Waypoint radius calibration** — `generateLoopWaypoints()` in `geometry.ts` uses `reach = target / (2 * numWaypoints)`. Was originally `/4` (too far), then `/9` (too close), now `/6` for 3wp and `/8` for 4wp.
4. **`continue_straight=true`** — Added to all Mapbox Directions API calls in `mapbox.ts` to discourage U-turns and out-and-back diversions.
5. **Trail/path snapping** — `extractAttractorPoints()` samples coordinates from Overpass paths/parks. `snapToNearbyPath()` snaps waypoints directly onto nearest trail point within range. This makes routes go ON trails instead of alongside them.
6. **Geocoder proximity bias** — `AddressSearch.tsx` accepts optional `proximity` prop. Landing page uses `'ip'`, wizard destination picker passes `startCenter`. Fixes results showing Australia instead of local.
7. **Results caching** — Results page checks `sessionStorage('routesmith_routes')` before calling API. Wizard clears cache on new generation. Detail→back is now instant.
8. **Rounded scores** — All sub-scores `Math.round()`'d in `scoreRoute()` so display shows whole numbers.

## 4. What's Left

### Priority 1: RLHF Scoring Tuning (IN PROGRESS — this is the exact next step)
The user wants to do iterative feedback rounds:
1. User generates routes with specific preferences
2. User evaluates the 3 results (distances, scores, quality)
3. User says which they'd pick and why
4. We tune scoring weights in `src/lib/scoring.ts` based on patterns

**Current scoring weights** (in `scoring.ts`):
- Distance fit: 20 pts — `scoreDistanceFit()` — full score if within range, degrades with overshoot
- Elevation match: 25 pts — `scoreElevation()` — based on grade % vs preference (flat/moderate/hilly)
- Scenery match: 25 pts — `scoreScenery()` — ratio of sample points near Overpass features
- Safety match: 20 pts — `scoreSafety()` — dedicated paths ratio or crossings per km
- Diversity bonus: 10 pts — `applyDiversityBonus()` — +5 per route >500m from others

**Potential tuning areas:**
- Weight rebalancing (e.g., should distance fit matter more now that it's a hard filter?)
- Scenery/safety scoring sensitivity (threshold distances, ratio calculations)
- Diversity bonus calibration
- Whether "no-preference" should score neutrally or differently

### Priority 2: Remaining Polish
- Route names are generic (from a static array) — could be more descriptive based on features
- Pre-existing lint warnings (`set-state-in-effect`) in results page, route detail, wizard, useLocalStorage hook — not blocking but should clean up eventually
- `boundingBox` unused import in `routeGenerator.ts`

## 5. Key Decisions & Context

### Architecture Decisions
- **12 candidates, not 6 or 18**: 6 was too few to reliably fill the distance range. 18 worked but was slow. 12 (3 targets × 4 bearings) is the sweet spot for load time vs quality.
- **Distance targets at p25/p50/p75, not min/mid/max**: Targeting the extremes caused too many candidates to overshoot/undershoot past the hard filter. Percentiles keep candidates clustered within range.
- **`routingOverhead = 2`**: The divisor in `generateLoopWaypoints`. Original `/4` produced routes 2x too long. `/3` was too short. `/2` gives `reach = target/6` for 3wp and `target/8` for 4wp — empirically calibrated.
- **Full snap to trails, not partial blend**: 60% blend toward trail points left waypoints NEAR trails but on parallel roads. 100% snap puts waypoints ON trails so Mapbox routes through them.
- **Hard distance filter with smart fallback**: 5% tolerance, falls back to closest-to-range if nothing passes. This replaced a soft scoring approach where out-of-range routes could still rank #1.

### Gotchas
- **`route/[id]/layout.tsx` searchParams**: Must use `resolvedParams?.data` (optional chaining) — `searchParams` can resolve to undefined during client-side navigation, causing "Cannot read properties of undefined" error
- **Results caching**: `sessionStorage('routesmith_routes')` must be cleared in wizard's `handleFinish()` or user sees stale routes after changing preferences
- **Elevation Tilequery API**: May fail if Mapbox token doesn't have Tilequery scope. Falls back to heuristic silently. Check Network tab for 403s.
- **Overpass API**: Can be slow/timeout. Returns empty arrays on failure — routes still generate but scenery/safety scores are unscored.

## 6. Files Modified in This Session

| File | Changes |
|---|---|
| `src/lib/routeGenerator.ts` | 12 candidates (3 targets × 4 bearings), hard distance filter, trail snapping, attractor extraction |
| `src/lib/geometry.ts` | `generateLoopWaypoints()` reach formula: `target / (2 * N)`, tighter jitter (0.8-1.2x) |
| `src/lib/scoring.ts` | `Math.round()` all sub-scores in `scoreRoute()` |
| `src/lib/mapbox.ts` | Added `continue_straight` param (defaults true) to `directionsUrl()` |
| `src/lib/elevation.ts` | Distance-based sampling (~0.1mi intervals), imports `haversineDistance` |
| `src/lib/geocoding.ts` | NEW — `reverseGeocode(lat, lng)` via Mapbox Geocoding API |
| `src/app/page.tsx` | Reverse geocode on map click (async, updates address in CTA) |
| `src/app/wizard/page.tsx` | P2P destination step, `startCenter` from sessionStorage initializer, clears cached routes, proximity on AddressSearch |
| `src/app/results/page.tsx` | Caches routes in sessionStorage, reads cache on mount before API call, mobile responsive tweaks |
| `src/app/route/[id]/page.tsx` | Mobile responsive: map height, panel padding, stats grid |
| `src/app/route/[id]/layout.tsx` | NEW — `generateMetadata()` with lz-string decompression, optional chaining fix |
| `src/app/route/[id]/error.tsx` | NEW — error boundary with Link |
| `src/app/layout.tsx` | OG defaults, twitter card, manifest link, theme-color, apple-touch-icon |
| `src/app/results/loading.tsx` | NEW — skeleton UI |
| `src/app/route/[id]/loading.tsx` | NEW — skeleton UI |
| `src/app/library/loading.tsx` | NEW — skeleton UI |
| `src/app/wizard/loading.tsx` | NEW — skeleton UI |
| `src/app/error.tsx` | NEW — root error boundary |
| `src/app/results/error.tsx` | NEW — results error boundary |
| `src/app/wizard/error.tsx` | NEW — wizard error boundary |
| `src/app/library/error.tsx` | NEW — library error boundary |
| `src/components/AddressSearch.tsx` | Added `proximity` prop, defaults to `'ip'` |
| `public/manifest.json` | NEW — PWA manifest |
| `public/icons/*.png` | NEW — 4 app icons |

## 7. Exact Next Step

**Start RLHF scoring tuning.** Ask the user to:
1. Run `npm run dev`, go to localhost:3000
2. Pick a location, go through wizard with specific preferences
3. Report back: preferences used, 3 routes returned (distances, scores, tags), which they'd pick and why
4. Tune weights in `src/lib/scoring.ts` based on feedback patterns

Key file: **`src/lib/scoring.ts`** — `scoreRoute()` (line ~160), `scoreDistanceFit()` (line 11), `scoreElevation()` (line 24), `scoreScenery()` (line 81), `scoreSafety()` (line 145), `applyDiversityBonus()` (line 183).

Secondary file: **`src/lib/routeGenerator.ts`** — `generateRoutes()` (line ~99) for candidate generation and filtering logic.

## 8. Completed Milestones (ALL 8 MVP PHASES)

### Scaffolding
- `create-next-app` w/ TS+Tailwind+App Router ✅
- Deps: `mapbox-gl`, `@mapbox/mapbox-gl-geocoder`, `nanoid`, `lz-string` + types ✅
- `.env.local` configured with Mapbox token ✅

### Pages (src/app/)
| Route | File | Status |
|---|---|---|
| `/` | `page.tsx` | ✅ Landing: fullscreen map + AddressSearch + click-to-pin + reverse geocoder + "Generate Route" CTA |
| `/wizard` | `wizard/page.tsx` | ✅ 6-step flow (7 for P2P with destination picker), stores prefs in sessionStorage |
| `/results` | `results/page.tsx` | ✅ POST /api/generate-routes, shows 3 RouteCards + MapWithRoute, caches results |
| `/route/[id]` | `route/[id]/page.tsx` | ✅ Detail view with OG meta tags via layout.tsx |
| `/library` | `library/page.tsx` | ✅ Saved routes list, filter/sort/delete |

### Components (src/components/)
`Map.tsx`, `MapWithRoute.tsx`, `AddressSearch.tsx` (with proximity bias), `WizardStep.tsx`, `OptionSelector.tsx`, `DistanceSlider.tsx`, `RouteCard.tsx`, `StarRating.tsx`, `ShareButton.tsx`, `Nav.tsx`

### Core Logic (src/lib/)
- **types.ts** — All types, `ACTIVITY_DEFAULTS`, `ROUTE_COLORS`
- **geometry.ts** — Geo math, calibrated `generateLoopWaypoints()`
- **routeGenerator.ts** — 12 candidates, hard distance filter, trail snapping, real elevation
- **scoring.ts** — 100-pt scoring with rounded integer sub-scores
- **overpass.ts** — OSM data fetching (parks/water/paths/crossings)
- **mapbox.ts** — Token getter, `directionsUrl()` with `continue_straight`
- **storage.ts** — localStorage CRUD
- **geocoding.ts** — Reverse geocoder via Mapbox
- **elevation.ts** — Real elevation via Tilequery with distance-based sampling

## 9. Build Commands

```bash
cd routesmith
npm run dev      # Dev server :3000
npm run build    # Production build (passes clean)
npm run lint     # ESLint (5 pre-existing warnings, none from recent work)
```

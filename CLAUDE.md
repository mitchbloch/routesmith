# Routesmith — Agent Context

Personalized exercise route generator (running, walking, biking). Web app built with Next.js App Router.

## Build & Run

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
```

## Setup

Copy `.env.local.example` to `.env.local` and set your Mapbox token:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

## Architecture

- **Next.js 16 + TypeScript + Tailwind CSS** — App Router, single repo
- **Mapbox GL JS** — map rendering, Directions API for routing
- **Overpass API** — OpenStreetMap data (parks, water, paths, crossings)
- **localStorage** — saved routes (no database for MVP)
- **lz-string** — compress routes into shareable URLs

### Key Directories

- `src/app/` — Pages (landing, wizard, results, route/[id], library) + API routes
- `src/components/` — Map, AddressSearch, RouteCard, WizardStep, etc.
- `src/lib/` — Core logic: types, geometry, scoring, routeGenerator, overpass, storage, mapbox, geocoding, elevation
- `src/hooks/` — useLocalStorage, useRouteLibrary

### Route Generation Flow

1. User sets start location on map (defaults to Boston, reverse geocodes map clicks) → wizard collects preferences (activity, route type, distance, elevation, scenery [multi-select], safety [multi-select]). P2P adds destination picker step.
2. POST `/api/generate-routes` with preferences (scenery/safety are arrays)
3. Server queries Overpass API for area features, generates 12 loop candidates (3 distance targets at p25/p50/p75 × 4 bearings) via Mapbox Directions with `continue_straight=true`. Waypoints snap to nearby trails/paths from Overpass data.
4. Hard-filters candidates to user's distance range (5% tolerance), scores survivors (distance fit, elevation, scenery, safety, diversity) → returns top 3
5. Client displays routes on map with detail cards. Results cached in sessionStorage for instant back-navigation.

### Scoring (0-100 points, integer scores)
- Distance fit: 20pts — full score if within range, degrades with overshoot
- Elevation match: 25pts — grade % vs preference (flat/moderate/hilly)
- Scenery match: 25pts — ratio of route near Overpass features (parks/water)
- Safety match: 20pts — dedicated path ratio or crossings per km
- Diversity bonus: 10pts — geographic separation between candidates

## Current State

- **Build**: `npm run build` passes clean. `npm run lint` has 5 pre-existing `set-state-in-effect` warnings (non-blocking).
- **MVP**: All 8 phases complete (landing → wizard → generation → results → detail → save/share/library)
- **Quick Wins**: Done — loading skeletons, error boundaries, mobile responsive polish
- **Stretch Goals**: Done — SSR OpenGraph meta, PWA manifest, reverse geocoder, P2P destination picker, real elevation via Tilequery
- **Algorithm Improvements**: Done — hard distance filter, 12 candidates (3 targets × 4 bearings), waypoint radius calibration, `continue_straight=true`, trail/path snapping, geocoder proximity bias, results caching, rounded scores
- **RLHF Scoring Tuning**: In progress — iterative feedback rounds to tune scoring weights

## Key Decisions

- **12 candidates, not 6 or 18**: 6 was too few to fill the distance range reliably. 18 was slow. 12 (3 targets × 4 bearings) balances load time vs quality.
- **Distance targets at p25/p50/p75, not min/mid/max**: Targeting extremes caused too many candidates to overshoot/undershoot past the hard filter. Percentiles keep candidates clustered within range.
- **`routingOverhead = 2`**: The divisor in `generateLoopWaypoints`. Original `/4` produced routes 2x too long, `/3` too short. `/2` gives `reach = target/6` for 3wp and `target/8` for 4wp — empirically calibrated.
- **Full snap to trails, not partial blend**: 60% blend toward trail points left waypoints NEAR trails but on parallel roads. 100% snap puts waypoints ON trails so Mapbox routes through them.
- **Hard distance filter with smart fallback**: 5% tolerance, falls back to closest-to-range if nothing passes. Replaced a soft scoring approach where out-of-range routes could still rank #1.

## Gotchas

- **`route/[id]/layout.tsx` searchParams**: Must use `resolvedParams?.data` (optional chaining) — `searchParams` can resolve to undefined during client-side navigation.
- **Results caching**: `sessionStorage('routesmith_routes')` must be cleared in wizard's `handleFinish()` or user sees stale routes after changing preferences.
- **Elevation Tilequery API**: May fail if Mapbox token doesn't have Tilequery scope. Falls back to heuristic silently. Check Network tab for 403s.
- **Overpass API**: Can be slow/timeout. Returns empty arrays on failure — routes still generate but scenery/safety scores are unscored.

## What's Next

### Priority 1: RLHF Scoring Tuning
Iterative feedback rounds: user generates routes → evaluates results → we tune scoring weights in `src/lib/scoring.ts`.

**Key files:**
- `src/lib/scoring.ts` — `scoreRoute()`, `scoreDistanceFit()`, `scoreElevation()`, `scoreScenery()`, `scoreSafety()`, `applyDiversityBonus()`
- `src/lib/routeGenerator.ts` — `generateRoutes()` for candidate generation and filtering

**Tuning areas:** weight rebalancing (distance fit value post-hard-filter), scenery/safety sensitivity, diversity bonus calibration, "no-preference" neutral scoring.

### Priority 2: Remaining Polish
- Route names are generic (static array) — could be more descriptive based on features
- Pre-existing lint warnings (`set-state-in-effect`) — not blocking but should clean up
- `boundingBox` unused import in `routeGenerator.ts`

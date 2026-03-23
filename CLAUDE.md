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

Copy `.env.local.example` to `.env.local` and set:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Architecture

- **Next.js 16 + TypeScript + Tailwind CSS** — App Router, single repo
- **Mapbox GL JS** — map rendering, Directions API for routing
- **Overpass API** — OpenStreetMap data (parks, water, paths, crossings)
- **Supabase** — Postgres + Auth + RLS for persistent storage
- **lz-string** — compress routes into shareable URLs

### Key Directories

- `src/app/` — Pages (landing, wizard, results, route/[id], library, login) + API routes
- `src/components/` — Map, AddressSearch, RouteCard, WizardStep, etc.
- `src/lib/` — Core logic: types, geometry, scoring, routeGenerator, overpass, storage, mapbox, geocoding, elevation
- `src/lib/supabase/` — Supabase client (server, browser, middleware, auth helper)
- `src/lib/routes.ts` — DAL: saved routes CRUD (snake_case ↔ camelCase row converters)
- `src/lib/corridors.ts` — DAL: corridor CRUD (for Phase 2)
- `src/lib/feedback.ts` — DAL: route feedback CRUD (for Phase 4)
- `src/hooks/` — useLocalStorage, useRouteLibrary (Supabase-backed with optimistic UI)
- `supabase/migrations/` — DB schema (001 initial, 002 auto-create profile)
- `tasks/todo.md` — Phased task tracker

### Auth

- Supabase email/password auth
- Middleware protects `/wizard`, `/results`, `/library` — redirects to `/login`
- Public routes: `/` (landing), `/route/[id]` (shared routes)
- Profile auto-created via database trigger on user signup

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

### Database Schema

- **profiles**: user settings, home location, default preferences
- **saved_routes**: route geometry, scores, metadata (replaces localStorage)
- **corridors**: discovered running corridors (Phase 2)
- **route_feedback**: RLHF data — chosen routes, ratings, preference snapshots (Phase 4)

RLS: `auth.uid() = user_id` on user-owned tables. Auto-discovered corridors readable by all authenticated users.

## Current State

- **Build**: `npm run build` passes clean. `npm run lint` has 5 pre-existing `set-state-in-effect` warnings (non-blocking).
- **GitHub**: github.com/mitchbloch/routesmith (public, MIT license)
- **Vercel**: https://routesmith-lime.vercel.app (auto-deploys on push to main)
- **MVP**: All 8 phases complete (landing → wizard → generation → results → detail → save/share/library)
- **Quick Wins**: Done — loading skeletons, error boundaries, mobile responsive polish
- **Stretch Goals**: Done — SSR OpenGraph meta, PWA manifest, reverse geocoder, P2P destination picker, real elevation via Tilequery
- **Algorithm Improvements**: Done — hard distance filter, 12 candidates (3 targets × 4 bearings), waypoint radius calibration, `continue_straight=true`, trail/path snapping, geocoder proximity bias, results caching, rounded scores
- **Infrastructure (Phase 1)**: In progress — Supabase backend, auth, DAL, API routes, Vercel deployment done. E2E verification remaining.

## Refactor Plan (4 Phases)

Full plan: `tasks/todo.md`

1. **Phase 1: Infrastructure** — Supabase + Vercel + auth + localStorage migration. ~80% done.
2. **Phase 2: Route Quality** — Corridor-based route generation (replacing compass-bearing waypoints). Key new files: `corridorGraph.ts`, `corridorPlanner.ts`.
3. **Phase 3: Claude Integration** — AI-generated route names/descriptions, NL preferences.
4. **Phase 4: RLHF & Polish** — Feedback collection, scoring tuning, corridor favorites, UX polish.

## Key Decisions

- **12 candidates, not 6 or 18**: 6 was too few to fill the distance range reliably. 18 was slow. 12 (3 targets × 4 bearings) balances load time vs quality.
- **Distance targets at p25/p50/p75, not min/mid/max**: Targeting extremes caused too many candidates to overshoot/undershoot past the hard filter. Percentiles keep candidates clustered within range.
- **`routingOverhead = 2`**: The divisor in `generateLoopWaypoints`. Original `/4` produced routes 2x too long, `/3` too short. `/2` gives `reach = target/6` for 3wp and `target/8` for 4wp — empirically calibrated.
- **Full snap to trails, not partial blend**: 60% blend toward trail points left waypoints NEAR trails but on parallel roads. 100% snap puts waypoints ON trails so Mapbox routes through them.
- **Hard distance filter with smart fallback**: 5% tolerance, falls back to closest-to-range if nothing passes. Replaced a soft scoring approach where out-of-range routes could still rank #1.
- **Corridor-based routing (Phase 2)**: Replacing compass-bearing waypoints with corridor graph traversal. Routes should follow natural running corridors (river paths, bike paths, park perimeters) and use bridges/intersections as turning points.

## Gotchas

- **`route/[id]/layout.tsx` searchParams**: Must use `resolvedParams?.data` (optional chaining) — `searchParams` can resolve to undefined during client-side navigation.
- **Results caching**: `sessionStorage('routesmith_routes')` must be cleared in wizard's `handleFinish()` or user sees stale routes after changing preferences.
- **Elevation Tilequery API**: May fail if Mapbox token doesn't have Tilequery scope. Falls back to heuristic silently. Check Network tab for 403s.
- **Overpass API**: Can be slow/timeout. Returns empty arrays on failure — routes still generate but scenery/safety scores are unscored.
- **Next.js 16 middleware deprecation**: Warning about `middleware` → `proxy` convention. Non-blocking, works fine.
- **localStorage migration**: Built into `useRouteLibrary` hook. One-time migration on first authenticated load, flag-based (`routesmith_migrated`).

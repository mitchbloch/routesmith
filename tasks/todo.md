# Routesmith Refactor — Task Tracker

## Phase 1: Infrastructure (Supabase + Vercel + Auth)

### 1.1 Supabase Setup
- [x] Create Supabase project (oqmlrkogthnjncqexwby)
- [x] Write migration: `supabase/migrations/001_initial_schema.sql` (profiles, saved_routes, corridors, route_feedback)
- [x] Set up RLS policies (user-owned data + auto-discovered corridors readable by all)
- [x] Auto-create profile trigger: `supabase/migrations/002_auto_create_profile.sql`
- [x] Run migrations in Supabase SQL Editor — verified success
- [x] Create user account in Supabase Auth dashboard

### 1.2 Supabase Client Integration
- [x] Create `src/lib/supabase/server.ts` (server client)
- [x] Create `src/lib/supabase/client.ts` (browser client)
- [x] Create `src/lib/supabase/middleware.ts` (session refresh, route protection)
- [x] Create `src/lib/supabase/auth.ts` (getUser helper)
- [x] Create `src/middleware.ts` (Next.js entry point)

### 1.3 Auth Flow
- [x] Create `src/app/login/page.tsx` (email/password login)
- [x] Verified: /wizard and /library redirect to /login when unauthenticated
- [ ] Update `src/app/layout.tsx` (auth provider — not yet needed, middleware handles session)

### 1.4 Data Access Layer
- [x] Create `src/lib/routes.ts` (DAL: CRUD, row converters, batch import)
- [x] Create `src/lib/corridors.ts` (DAL: corridor CRUD)
- [x] Create `src/lib/feedback.ts` (DAL: feedback CRUD)

### 1.5 API Routes
- [x] Create `src/app/api/routes/route.ts` (GET list, POST create/batch)
- [x] Create `src/app/api/routes/[id]/route.ts` (GET, PATCH, DELETE)

### 1.6 Migration & Integration
- [x] Update `src/hooks/useRouteLibrary.ts` (swap localStorage → Supabase via API, optimistic UI)
- [x] localStorage migration built into useRouteLibrary (one-time, flag-based)
- [x] Install deps: `@supabase/ssr`, `@supabase/supabase-js`
- [ ] Update `src/app/library/page.tsx` (currently works via hook, may want server-side fetch later)

### 1.7 Deployment
- [x] Initialize git repo
- [x] Push to GitHub (github.com/mitchbloch/routesmith, public)
- [x] Deploy to Vercel (https://routesmith-lime.vercel.app)
- [x] Configure env vars in Vercel dashboard (MAPBOX_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY)
- [x] Fix git committer email (`mrbloch@MacBook-Air.local` → `mbloch98@gmail.com`) — was blocking Vercel deploys
- [x] Make repo public + add MIT license
- [ ] Verify live URL works end-to-end

### 1.8 End-to-End Verification
- [x] `npm run build` passes clean
- [x] Auth redirect works (wizard/library → login)
- [x] Login → sign in → redirects to home
- [x] Generate route → save → refresh → persists from Supabase
- [ ] localStorage migration works for existing saved routes
- [ ] Shared route URLs (`/route/[id]`) work without auth
- [ ] Verify on live Vercel URL

### Notes
- Next.js 16 deprecation warning: `middleware` → `proxy` convention. Non-blocking, works fine.
- `.gitignore` updated: excludes `reference/examples/` and `tasks/lessons.md`
- `.env.local` and `.env.local.example` updated with Supabase vars

---

## Phase 2: Route Quality (Corridor-Based Generation)

### 2.1 Enhanced Overpass Query
- [x] Add bridge, named trail, multi-use path tags to query
- [x] Update `OverpassData` type with `bridges`, `namedRoutes`
- [x] Increase search radius for corridor discovery (1.5× max distance, min 5km)
- [x] Increase Overpass timeout from 15s to 25s

### 2.2 Corridor Graph Builder
- [x] Create `src/lib/corridorGraph.ts`
- [x] Implement segment extraction from Overpass data
- [x] Implement endpoint snapping via grid spatial index (20m tolerance)
- [x] Implement collinear segment merging
- [x] Implement node identification (bridges, intersections, dead ends)
- [x] Implement quality scoring for segments (dedicated path, named, near water/park, surface)
- [x] Build adjacency list
- [x] Implement graph density assessment (`assessGraphDensity`)

### 2.3 Corridor-Based Route Planner
- [x] Create `src/lib/corridorPlanner.ts`
- [x] Strategy A: Single corridor out-and-back (2-3 mi)
- [x] Strategy B: Two-corridor loop (3-4 mi)
- [x] Strategy C: Multi-corridor loop (4-5+ mi) — BFS with distance budget + heading-home heuristic
- [x] Strategy D: Exploratory (variety) — seeded random walk
- [x] Waypoint extraction with 20-waypoint cap for Mapbox API

### 2.4 Integration
- [x] Update `src/lib/routeGenerator.ts` with corridor planner
- [x] Add fallback to compass-bearing for sparse data
- [x] Update scoring: corridor adherence (20pts)
- [x] Rebalance scoring weights (15/20/20/15/20/10)
- [x] Update route detail page score display

### 2.5 Verification
- [x] `npm run build` passes clean
- [x] Fallback works for sparse OSM areas (verified when Overpass was down)
- [ ] Routes follow corridors in Cambridge/Boston (pending Overpass API availability)
- [ ] No zigzags through residential streets
- [ ] Multiple distinct routes from same start
- [ ] Performance < 10 seconds with corridor routing active

---

## Phase 3: Claude Integration

### 3.1 Route Descriptions
- [ ] Create `src/lib/claude.ts` (API client + prompts)
- [ ] Integrate naming into generation pipeline
- [ ] Add `description` field to `GeneratedRoute`
- [ ] Display descriptions in RouteCard
- [ ] Graceful fallback on API error

### 3.2 Natural Language Preferences (Stretch)
- [ ] Create `src/app/api/parse-preferences/route.ts`
- [ ] Add NL input option to wizard

---

## Phase 4: RLHF & Polish

### 4.1 Feedback Collection
- [ ] Record route choices in `route_feedback`
- [ ] Track chosen vs skipped routes
- [ ] Snapshot preferences with feedback

### 4.2 Scoring Tuning
- [ ] Create `src/lib/scoringTuner.ts`
- [ ] Analyze feedback data
- [ ] Adjust scoring weights

### 4.3 UX Polish
- [ ] Corridor names on route cards
- [ ] Corridor overlay on map
- [ ] Favorite corridors
- [ ] Loading progress indicators

---

## Review / Lessons
_(Added after each phase)_

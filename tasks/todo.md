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
- [ ] Login → sign in → redirects to home
- [ ] Generate route → save → refresh → persists from Supabase
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
- [ ] Add bridge, named trail, multi-use path tags to query
- [ ] Update `OverpassData` type with `bridges`, `namedRoutes`
- [ ] Increase search radius for corridor discovery

### 2.2 Corridor Graph Builder
- [ ] Create `src/lib/corridorGraph.ts`
- [ ] Implement segment extraction from Overpass data
- [ ] Implement collinear segment merging
- [ ] Implement node identification (bridges, intersections, dead ends)
- [ ] Implement quality scoring for segments
- [ ] Build adjacency list

### 2.3 Corridor-Based Route Planner
- [ ] Create `src/lib/corridorPlanner.ts`
- [ ] Strategy A: Single corridor out-and-back (2-3 mi)
- [ ] Strategy B: Two-corridor loop (3-4 mi)
- [ ] Strategy C: Multi-corridor loop (4-5+ mi)
- [ ] Strategy D: Exploratory (variety)

### 2.4 Integration
- [ ] Update `src/lib/routeGenerator.ts` with corridor planner
- [ ] Add fallback to compass-bearing for sparse data
- [ ] Update scoring: corridor adherence (25pts), smoothness (10pts)
- [ ] Rebalance existing scoring weights

### 2.5 Verification
- [ ] Routes follow corridors in Cambridge/Boston
- [ ] No zigzags through residential streets
- [ ] Multiple distinct routes from same start
- [ ] Fallback works for sparse OSM areas
- [ ] Performance < 10 seconds

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

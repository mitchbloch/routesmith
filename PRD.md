# Routesmith — Product Requirements Document

## Overview

Routesmith is a web application that generates personalized exercise routes (running, walking, biking) based on user preferences. Users answer a short series of questions — distance, elevation, scenery, path safety — and receive a curated set of routes displayed on an interactive map. Routes can be saved to a personal library, named, rated, and shared via link.

## Target Audience

Fitness enthusiasts (runners, walkers, cyclists) who want variety in their outdoor exercise routes and care about route quality beyond just distance — scenery, safety, elevation profile, and path infrastructure matter to them.

## MVP Platform

**Web-first (mobile-responsive PWA).** Fastest path to a shareable MVP — no app store review, instant deploys, works on any device via a link. Native iOS can follow once the concept is validated.

## Core User Flow

### 1. Set Starting Location

User searches for an address or drops a pin on the map to set their starting point. GPS auto-detect is a post-MVP enhancement. Map defaults to Boston on initial load.

### 2. Preference Wizard (Step-by-Step)

A guided flow, one question per screen:

**Step 1 — Activity Type**
- Walking
- Running
- Biking

**Step 2 — Route Type**
- Loop (start and end at the same location)
- Point-to-point (user sets a destination)

**Step 3 — Distance Range**
- Slider or input for min/max distance (miles or km, user-selectable)
- Sensible defaults per activity type:
  - Walking: 1–3 mi
  - Running: 2–6 mi
  - Biking: 5–15 mi

**Step 4 — Elevation Preference**
- Flat (minimal elevation change) — icon: horizontal line (➖)
- Moderate (some hills) — icon: rolling hills (〰️)
- Hilly (maximize elevation gain) — icon: mountain (🏔️)
- No Preference — icon: shrug (🤷)

**Step 5 — Scenery Preference** *(multi-select: user may choose multiple options)*
- Parks / green space
- Waterfront / lakeside
- Urban / city streets
- Residential / quiet neighborhoods
- No preference *(auto-deselects other options if chosen; selecting another option auto-deselects this)*

**Step 6 — Path Safety** *(multi-select: user may choose multiple options)*
- Prefer dedicated paths / sidewalks
- Minimize street crossings / traffic lights
- No preference *(auto-deselects other options if chosen; selecting another option auto-deselects this)*

### 3. Route Results

The app generates **3 routes**, ranked by best match to the user's preferences. Each route card displays:

- Route name (auto-generated, e.g., "Lakefront Loop via Lincoln Park")
- Map overlay showing the route path
- Total distance
- Estimated elevation gain/loss
- Estimated duration (based on activity type and average pace)
- Tags indicating which preferences it matches well (e.g., "Flat", "Waterfront", "Low traffic")

The user taps a route card to expand a full-screen map view with the route overlay and detailed stats.

### 4. Route Library

After viewing a route, the user can:

- **Save** the route to their library
- **Name** it (custom name, overriding auto-generated name)
- **Rate** it (1–5 stars, after completing the route)
- **Share** it via a shareable link (recipient sees the route on a map without needing an account)

The library view shows all saved routes with filters by activity type, rating, and distance.

## User Accounts

**Optional accounts (local-first with optional sign-up):**

- The app works immediately without an account. Saved routes are stored in browser local storage.
- A sign-up prompt appears when the user first saves a route, explaining the benefit (sync across devices, persistent storage, sharing).
- Users who sign up get cloud-synced route libraries accessible from any device.
- Auth method: email + password, with Google/Apple social login as stretch goals.

This approach eliminates friction for new users while still enabling cloud features for engaged users.

## Route Generation Algorithm

### Inputs
- Starting location (lat/lng)
- Activity type
- Route type (loop vs. point-to-point)
- Distance range (min/max)
- Elevation preference
- Scenery preference
- Path safety preference

### Processing
1. **Candidate generation**: Generate multiple candidate routes within the distance range from the starting point (or between start/end for point-to-point).
2. **Scoring**: Score each candidate against user preferences:
   - Elevation profile match (flat/moderate/hilly)
   - Scenery match (proximity to parks, water, etc. using map POI data)
   - Path safety (percentage of route on dedicated paths/sidewalks, number of major road crossings)
3. **Ranking**: Sort by composite score, return top 3.
4. **Diversity**: Ensure the 3 returned routes are meaningfully different (not minor variations of the same path). Apply a minimum geographic diversity threshold.

### Data Requirements
- **Road/path network**: Pedestrian and cycling path data with sidewalk/bike lane attributes.
- **Elevation data**: Elevation at sufficient resolution to compute grade along the route.
- **Points of interest**: Parks, water bodies, trail designations for scenery scoring.
- **Traffic signals / crossings**: Intersection data for safety scoring.

## Mapping & Routing API Comparison

The choice of mapping provider is the most consequential technical decision. Here is a comparison:

| Criteria | Google Maps Platform | Mapbox | OpenStreetMap + OSRM |
|---|---|---|---|
| Route quality | Excellent, best real-world data | Very good | Good, community-maintained |
| Elevation API | Yes (Roads API) | Yes (Tilequery) | External (Open-Elevation) |
| Sidewalk / path data | Limited | Limited | Best (tagged by community) |
| Scenery / POI data | Excellent (Places API) | Good | Good (Overpass API) |
| Custom route generation | Limited (Directions API gives A-to-B, not loops) | More flexible (Mapbox Optimization API) | Full control (OSRM or Valhalla self-hosted) |
| Pricing | $5–$10 per 1,000 route requests, adds up fast | Generous free tier (100K requests/mo), then pay-per-use | Free (self-hosted) or cheap (hosted services) |
| Map styling | Limited | Highly customizable | Fully customizable |
| Ease of integration | Easiest | Easy | Moderate (more setup) |

**Recommendation for MVP**: **Mapbox** strikes the best balance — good free tier, solid routing API, customizable maps, and enough flexibility for loop route generation. Supplement with OpenStreetMap Overpass API for sidewalk/path/scenery data that Mapbox lacks.

**Alternative**: If maximum control over routing is needed (especially for loop generation and scoring), consider **OSRM or Valhalla (self-hosted) + Mapbox GL JS (for map display only)**. More work upfront but no per-route API costs and full control over the routing algorithm.

## Technical Architecture (Recommended)

### Frontend
- **React** (or Next.js for SSR/SEO) as the web framework
- **Mapbox GL JS** for interactive map rendering
- **PWA** setup for add-to-home-screen, caching of static assets
- Mobile-responsive design (mobile is the primary use case)

### Backend
- **Node.js** (Express or Fastify) or **Python** (FastAPI) — either works, choose based on team preference
- RESTful API for route generation, route library CRUD, user auth
- Route generation service as a separate module for testability and future scaling

### Database
- **PostgreSQL** with **PostGIS** extension for geospatial queries
- Store user accounts, saved routes (as GeoJSON), ratings, route metadata

### External APIs
- **Mapbox Directions API** — route generation between waypoints
- **Mapbox Tilequery API** — elevation data
- **OpenStreetMap Overpass API** — sidewalk, bike lane, park, and water body data
- **Mapbox GL JS** — client-side map rendering

### Infrastructure (MVP)
- Frontend: Vercel or Netlify (free tier)
- Backend: Railway, Render, or Fly.io (free/cheap tier)
- Database: Supabase (PostgreSQL + PostGIS, free tier) or Railway Postgres

## Route Sharing

Shared routes are accessible via a public URL (e.g., `routesmith.app/route/abc123`). The shared view displays:

- The route on an interactive map
- Distance, elevation, estimated duration
- The sharer's custom name and rating (if any)

No account is required to view a shared route. A "Try Routesmith" CTA encourages the viewer to generate their own routes.

## Out of Scope for MVP

These features are intentionally excluded from the first release to keep scope tight:

- **Native iOS / Android apps** — web-first, native later
- **GPS auto-detect for starting location** — manual pin/search only for MVP
- **Real-time navigation / turn-by-turn directions** — map overlay only
- **Fitness tracking** (pace, calories, heart rate, workout history)
- **Offline support** — internet required to generate and view routes
- **Social features** (follow users, community routes, leaderboards)
- **Route tags and notes** — save, name, rate, and share only for MVP
- **AI/chat-based route input** — structured wizard only for MVP
- **Monetization / payments** — free MVP, monetization model TBD after validation

## Success Metrics

- Number of routes generated per user session
- Percentage of generated routes that are saved to library
- Route share rate (routes shared / routes saved)
- Return user rate (users who come back within 7 days)
- User-reported route quality (star ratings distribution)

## Open Questions

1. **Loop route algorithm**: Generating good circular routes of a target distance is a non-trivial algorithmic problem. Needs a spike/prototype to evaluate feasibility with Mapbox Directions API vs. self-hosted OSRM.
2. **Scenery data quality**: How reliably can we determine "scenic" from OSM data? May need to prototype the scoring and manually validate against known routes.
3. **Path safety data coverage**: Sidewalk and crossing data in OSM varies significantly by city. Need to assess data quality in target launch cities.
4. **App name availability**: Verify `routesmith.app` (or similar) domain availability and that "Routesmith" doesn't conflict with existing trademarks.

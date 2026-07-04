# FeraMap — Project Report

**Hackathon:** #hackthekitty 2026  
**Team:** HackTheKitty  
**Category:** Community Impact / Animal Welfare  
**Location Focus:** Ciudad Lerdo, Durango, México

---

## 1. Project Overview

FeraMap is a community-driven mobile app for tracking and managing stray cat colonies through the TNR (trap-neuter-return) methodology. It gives three different user types the tools they actually need:

- **Community members** can spot, photograph, and name a stray cat in under a minute using a guided 5-step report flow.
- **TNR volunteers** can claim trapping tasks from a prioritized queue, log status updates, and coordinate without relying on group chats.
- **Colony coordinators** get a live dashboard of neuter rates by neighbourhood zone and can export a formatted PDF progress report to share with municipal partners.

The app is built for real use in Ciudad Lerdo, Durango, where an active community of cat caretakers has been doing TNR work without any dedicated digital tooling.

---

## 2. Hackathon Theme Relevance

The #hackthekitty theme calls for technology that meaningfully improves the lives of stray cats and the communities that care for them. FeraMap addresses this at multiple levels:

- **Data where there was none** — individual cats get persistent digital profiles that survive volunteer turnover. A cat spotted today can be recognised and tracked in five years.
- **Coordination without friction** — the trap queue replaces informal WhatsApp coordination. Volunteers can self-assign tasks, update statuses, and release tasks back to the queue from the same screen.
- **Accountability for organisations** — the PDF export gives colony managers a printable progress report they can hand to municipal authorities, vets, or donors without any manual data wrangling.
- **Community ownership** — the follow feature lets neighbours stay informed about cats they care about, and the AI-generated summaries give each cat a readable biography that makes the profiles shareable and emotionally engaging.

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile framework | React Native 0.81.5 + Expo SDK 54 |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| Backend | Supabase (PostgreSQL + PostGIS + Auth + Storage + Edge Functions) |
| Spatial data | PostGIS `geography(Point, 4326)` + GiST index |
| AI integration | Google Gemini 2.5 Flash via Supabase Edge Function (Deno) |
| Maps | react-native-maps 1.20.1 |
| GPS | expo-location |
| Camera / gallery | expo-image-picker |
| Photo storage | Supabase Storage (`cat-photos` bucket) |
| PDF export | expo-print + expo-sharing |
| Auth persistence | @react-native-async-storage/async-storage |
| Image encoding | expo-file-system (base64) + base64-arraybuffer |
| Language | JavaScript (app) + TypeScript (Edge Function) |

---

## 4. Architecture

### 4.1 Application layers

```
┌─────────────────────────────────────────────┐
│           React Native / Expo App            │
│  ┌──────────────┐   ┌───────────────────┐   │
│  │  Navigation  │   │     Screens       │   │
│  │  (RootStack  │   │  MapScreen        │   │
│  │  + TabNav    │   │  CatProfileScreen │   │
│  │  + ReportNav)│   │  TrapQueueScreen  │   │
│  └──────────────┘   │  ColonyScreen     │   │
│                     │  ProfileScreen    │   │
│                     │  report/* (5 steps)│  │
│                     └───────────────────┘   │
└─────────────────────────────────────────────┘
                        │  Supabase JS client
┌─────────────────────────────────────────────┐
│              Supabase Platform               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │PostgreSQL│  │ Storage  │  │   Auth   │  │
│  │+PostGIS  │  │(cat-photos│  │ (email/  │  │
│  │  (7 RLS  │  │  bucket) │  │password) │  │
│  │  tables) │  └──────────┘  └──────────┘  │
│  └──────────┘                               │
│  ┌──────────────────────────────────────┐   │
│  │  Edge Function: generate-cat-summary │   │
│  │  (Deno + JWT verification + Gemini)  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 4.2 Authentication flow

1. App starts → `supabase.auth.getSession()` checks AsyncStorage for a persisted session.
2. If no session → `LoginScreen` (email + password, or sign-up).
3. After login → `checkProfileCompletion()` queries `profiles.display_name`.
4. If no display name → `OnboardingScreen` (name, avatar, colony selection).
5. After onboarding → `RootStack` (TabNavigator + modal screens).
6. Auth state changes (token refresh, logout) are handled by `onAuthStateChange`.

### 4.3 Database schema

Seven tables, all with Row Level Security enabled:

| Table | Purpose |
|-------|---------|
| `colonies` | Top-level community groups (e.g., "Colonia Centro") |
| `zones` | Polygon sub-areas within a colony (PostGIS `geometry(Polygon, 4326)`) |
| `profiles` | User profiles — linked to `auth.users`, stores role, avatar, colony |
| `cats` | Core entity — name, status, priority, AI summary, zone/colony assignment |
| `sightings` | Each sighting event — GPS point, condition, notes, reporter |
| `cat_photos` | Photo URLs linking to Supabase Storage |
| `user_follows` | Many-to-many user ↔ cat follow relationship |

Cat status lifecycle: `spotted` → `trapped` → `neutered` / `returned`

Priority levels: `Low` / `Medium` / `High` / `Urgent` / `Overdue`

### 4.4 Spatial data

- Sightings store location as `geography(Point, 4326)` (PostGIS).
- A GiST index on `sightings.location` supports fast radius queries.
- The `MapScreen` calls a custom RPC `get_cats_with_locations` to retrieve cats with their latest sighting coordinates in a single round trip.
- Zone boundaries are stored as `geometry(Polygon, 4326)` and used for automatic zone assignment during reporting.
- Location fallback: if GPS permission is denied, the app defaults to coordinates for Ciudad Lerdo (25.5428, -103.4068).

### 4.5 AI summary generation

The `generate-cat-summary` Supabase Edge Function:

1. Validates the caller's Bearer JWT using the Supabase anon client.
2. Fetches cat details and full sighting history using the service role client.
3. Builds a Spanish-context, English-output prompt for Gemini 2.5 Flash.
4. Parses the response and writes the generated summary back to `cats.summary`.
5. Returns the summary to the client.

The function is secured with JWT verification — unauthenticated callers receive a 401 before any AI call is made.

### 4.6 Report flow (5-step modal stack)

```
Location → Identify → Camera → Details → Success
```

1. **Location** — drops a GPS pin on a MapView; user can drag to adjust.
2. **Identify** — shows up to 2 recently spotted cats for quick re-identification, or the user selects "new cat".
3. **Camera** — opens `expo-image-picker` for camera capture or gallery selection.
4. **Details** — name (optional), condition (required), notes (optional); submits cat + sighting + photo to Supabase.
5. **Success** — confirmation screen with links to the cat profile and map.

Photo upload sequence: `expo-file-system.readAsStringAsync` (base64) → `base64-arraybuffer.decode` (ArrayBuffer) → `supabase.storage.upload` → insert public URL into `cat_photos`.

---

## 5. Features Summary

| Feature | Screen(s) |
|---------|----------|
| Email / password authentication | LoginScreen |
| First-time onboarding with avatar and colony selection | OnboardingScreen |
| Live GPS map with colour-coded status markers | MapScreen |
| Status filter chips (All / Spotted / Trapped / Neutered / Returned) | MapScreen |
| Nearby cats bottom sheet with photo thumbnails | MapScreen |
| Searchable, filterable cat list | CatsScreen |
| Cat profile with animated polaroid photo stack | CatProfileScreen |
| Sighting history timeline | CatProfileScreen |
| AI-generated cat biography (Gemini 2.5 Flash) | CatProfileScreen |
| Follow / unfollow cats | CatProfileScreen |
| 5-step guided cat report flow | report/* |
| GPS pin-drop with drag adjustment | LocationScreen |
| Re-identify existing cats during report | IdentifyScreen |
| Camera capture or gallery photo pick | CameraScreen |
| Photo upload to Supabase Storage | DetailsScreen |
| Colony statistics dashboard | ColonyScreen |
| Progress bars by neighbourhood zone | ColonyScreen |
| PDF progress report export and share | ColonyScreen |
| TNR trap queue with priority filters | TrapQueueScreen |
| Volunteer self-assignment and task release | TrapQueueScreen |
| Multi-step status update (spotted → trapped → neutered/returned) | TrapQueueScreen |
| User profile with 8-option cat avatar picker | ProfileScreen |
| Followed cats list | ProfileScreen |
| Colony selector in profile | ProfileScreen |

---

## 6. Testing Approach

All testing during the hackathon was performed manually. The app was run on physical Android and iOS devices using Expo Go. Each feature area was exercised through the UI, covering both happy paths and error/edge cases.

See [`TESTING_MATRIX.md`](./TESTING_MATRIX.md) for the full manual test log.

---

## 7. Tools Used

| Tool | Purpose |
|------|---------|
| Expo SDK 54 | Mobile app framework and device API access |
| Supabase | Backend — PostgreSQL, Auth, Storage, Edge Functions |
| PostGIS | Spatial queries and GPS data storage |
| Google Gemini 2.5 Flash | AI cat biography generation |
| react-native-maps | Map rendering with custom markers |
| expo-location | GPS coordinates |
| expo-image-picker | Camera and gallery photo selection |
| expo-print + expo-sharing | PDF generation and native share sheet |
| Deno | Edge Function runtime |
| VS Code / Kiro | Development environment |
| Git + GitHub | Version control |

---

## 8. Known Limitations

- The `IdentifyScreen` currently fetches the 2 most recently added cats rather than the 2 spatially nearest — a PostGIS proximity query was scaffolded but the RPC was not deployed in time for the hackathon cut-off.
- The app targets portrait orientation only.
- There is no push notification system; volunteers must open the app to see new queue items.
- The "forgot password" link on the login screen is present in the UI but not yet wired to Supabase's password reset email flow.

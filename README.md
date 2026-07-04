# FeraMap

Community-driven stray cat TNR (trap-neuter-return) tracking app, built for #hackthekitty 2026.

FeraMap lets community members spot and name stray cats, volunteers coordinate TNR operations, and organizations track colony progress — all from a single mobile app.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or higher |
| npm | 9 or higher (bundled with Node 18) |
| Expo CLI | installed globally via `npm install -g expo-cli` |
| Expo Go app | installed on your physical device (iOS or Android), or an Android/iOS simulator |
| Supabase account | free tier is sufficient |

---

## Environment Configuration

The app reads two public environment variables. Create a `.env` file in the project root (it is already listed in `.gitignore`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are available in your Supabase project under **Project Settings → API**.

### Supabase Edge Function secret

The `generate-cat-summary` Edge Function requires a Gemini API key stored as a Supabase secret:

```bash
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Database Setup

1. Link your local Supabase CLI to the project:

   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

2. Push the database schema (includes PostGIS extension, all 7 tables, RLS policies, and spatial index):

   ```bash
   supabase db push
   ```

3. (Optional) Seed the database with sample colonies and zones:

   ```bash
   supabase db reset --linked
   ```
   
   Or run the seed file manually in the Supabase SQL editor using the contents of `supabase/seed.sql`.

---

## Deploy the Edge Function

```bash
supabase functions deploy generate-cat-summary
```

The function is located at `supabase/functions/generate-cat-summary/index.ts`. It requires the `GEMINI_API_KEY` secret set in the step above.

---

## Installation

```bash
npm install
```

---

## Running the App

Start the Expo development server:

```bash
npx expo start
```

Then:

- **Physical device** — scan the QR code with the Expo Go app (iOS or Android).
- **Android emulator** — press `a` in the terminal after the dev server starts.
- **iOS simulator** — press `i` in the terminal (macOS only).

---

## Project Structure

```
feramap/
├── App.js                        # Root component, auth & navigation logic
├── src/
│   ├── lib/
│   │   └── supabase.js           # Supabase client initialization
│   ├── navigation/
│   │   ├── TabNavigator.js       # Bottom tab bar (Map, Cats, Colony, Profile)
│   │   └── ReportNavigator.js    # Report modal stack (Location → Identify → Camera → Details → Success)
│   └── screens/
│       ├── LoginScreen.js        # Email/password auth (sign in & sign up)
│       ├── OnboardingScreen.js   # First-time profile setup (name, avatar, colony)
│       ├── MapScreen.js          # Live GPS map with cat markers and status filters
│       ├── CatsScreen.js         # Searchable cat list with status filters
│       ├── CatProfileScreen.js   # Individual cat profile with sighting history and AI summary
│       ├── ColonyScreen.js       # Colony statistics, progress bars, PDF export
│       ├── ProfileScreen.js      # User profile, followed cats, avatar picker
│       ├── TrapQueueScreen.js    # TNR volunteer coordination queue
│       └── report/
│           ├── LocationScreen.js # GPS pin drop step
│           ├── IdentifyScreen.js # Match to existing cat or create new
│           ├── CameraScreen.js   # Camera capture or gallery pick
│           ├── DetailsScreen.js  # Condition, name, notes input + Supabase submit
│           └── SuccessScreen.js  # Confirmation screen
├── supabase/
│   ├── functions/
│   │   └── generate-cat-summary/ # Deno Edge Function — Gemini AI summary generation
│   └── migrations/
│       └── 0001_initial_schema.sql
└── assets/
    └── avatars/                  # 8 cat avatar PNG files
```

---

## Key Technical Notes

- **PostGIS** — sightings store GPS coordinates as `geography(Point, 4326)`. A GiST spatial index on `sightings.location` powers proximity queries.
- **Row Level Security** — all 7 tables have RLS enabled. Public read is allowed on colonies, zones, cats, sightings, and photos. Writes require authentication. Cat status updates are restricted to the assigned volunteer or a coordinator.
- **Photo uploads** — images are read as base64 via `expo-file-system`, decoded to `ArrayBuffer` using `base64-arraybuffer`, and uploaded to Supabase Storage under the `cat-photos` bucket.
- **AI summaries** — the `generate-cat-summary` Edge Function verifies the caller's JWT, fetches the cat's sighting history, and calls Gemini 2.5 Flash to generate a 3-sentence biography that is saved back to `cats.summary`.
- **Real-time map** — `useFocusEffect` re-fetches cat data every time the Map tab gains focus, so newly reported cats appear without a manual refresh.

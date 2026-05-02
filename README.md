# Angles App

Personal workout tracking app — log workouts, track progress, and hit personal records.

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI, SQLAlchemy 2.0 async, Alembic |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT) |
| Frontend | React Native, Expo (SDK 54), Expo Router |
| State | Zustand + AsyncStorage |
| Package managers | `uv` (backend), `npm` (frontend) |

Live API: https://gym-community-app.onrender.com

---

## Features

- **Workout logging** — start an empty workout or from a saved routine, log sets with weight and reps
- **Routines** — create and edit reusable workout templates
- **Explore** — browse seeded workout programs (Push/Pull/Legs, Upper/Lower, etc.)
- **Rest timer** — configurable auto-timer after each completed set
- **Workout summary** — post-workout summary screen with stats and option to save as routine
- **Workout history** — full log history on your profile with a tappable detail view
- **Personal records** — per-exercise PR detection shown on the workout detail screen
- **Progress graphs** — 14-day volume and reps bar charts on the profile screen
- **Exercise library** — searchable exercise database with GIF demos and history per exercise
- **Profile** — avatar, bio, day streak, and lifetime stats

---

## Backend

```bash
cd backend
uv sync
cp .env.example .env   # fill in real values
uv run uvicorn app.main:gym_app --reload
```

API docs: http://localhost:8000/docs

### Required environment variables (`backend/.env`)

```
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
SUPABASE_SERVICE_KEY=...
SUPABASE_JWT_SECRET=...
```

### Database migrations

```bash
# Apply all pending migrations
uv run alembic upgrade head

# Generate a new migration after model changes
uv run alembic revision --autogenerate -m "description"
```

### Tests

```bash
uv run pytest -v
```

Tests use SQLite in-memory and require a live Supabase connection to create test users.

---

## Frontend

### Prerequisites

- Node.js + npm
- Expo Go (mobile) or Android Studio / Xcode (emulator)
- JDK 17 if using Android emulator

```bash
cd Frontend-For-APP
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

### Android emulator setup (first time)

1. Install Android Studio and open **Device Manager**
2. Create a virtual device (any Phone profile)
3. Add `platform-tools` to your PATH:
   - **Windows:** `%LOCALAPPDATA%\Android\Sdk\platform-tools`
   - **Linux/macOS:** `~/Android/Sdk/platform-tools` → add `export PATH=$PATH:~/Android/Sdk/platform-tools` to `~/.bashrc` or `~/.zshrc`
4. Run `adb devices` to verify, then `npx expo start` and press `a`

---

## Project structure

```
Gym-Community-App/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, routers
│   │   ├── dependencies.py  # Auth (JWT decode + Supabase fallback)
│   │   ├── db.py            # SQLAlchemy engine, Base, GUID type
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic v2 request/response models
│   │   └── routes/          # FastAPI routers
│   ├── alembic/             # Migration history
│   └── tests/
└── Frontend-For-APP/
    ├── app/                 # Expo Router screens
    │   ├── (tabs)/          # workouts + profile tabs
    │   ├── activeWorkout.jsx
    │   ├── workout-summary.jsx
    │   ├── workout-log-detail.jsx
    │   └── explore.jsx
    ├── stores/
    │   └── workoutStore.js  # Zustand store (active workout + cache)
    ├── lib/
    │   ├── workoutApi.jsx   # All workout/exercise API calls
    │   ├── api.jsx          # Base fetch + auth header
    │   └── localCache.jsx   # AsyncStorage cache layer
    └── assets/
        └── workout_covers/  # Local cover images for seeded workouts
```

---

## Team

- Backend: Danny, Omar
- Frontend: Mariano, Omar, Still Ben
- UI/Design: Mariano
- DevOps: Alberto
- PM: Angel

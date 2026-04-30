# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

# Angles App

## What this is
Personal workout tracking app. FastAPI backend + React Native frontend.

## Backend
- FastAPI, SQLAlchemy 2.0 async, Supabase PostgreSQL
- Deployed: https://gym-community-app.onrender.com
- Run tests: PYTHONPATH="" uv run pytest -v
- Package manager: uv

## Frontend  
- React Native / Expo
- Located in: Frontend-For-APP/

## Current PRD
See docs/PRD.md for current priorities and user stories.

## Key decisions
- GUID type in db.py handles UUID for both SQLite (tests) and PostgreSQL (prod)
- Email confirmation disabled for demo
- Alembic manages all migrations — never use create_all
- compare_type=False in alembic env.py to prevent GUID→UUID migrations

## Do not touch
- Follow/unfollow endpoints — out of scope
- Social feed — out of scope
- workout_covers bucket — read only
---

## Backend (`backend/`)

### Commands

```bash
# Run dev server (from backend/)
uv run uvicorn app.main:gym_app --reload

# Run all tests
uv run pytest

# Run a single test file
uv run pytest tests/test_workout_logs.py

# Run a single test by name
uv run pytest tests/test_workout_logs.py::test_function_name -v

# Apply migrations
uv run alembic upgrade head

# Create a new migration
uv run alembic revision --autogenerate -m "description"
```

### Architecture

**Entry point:** `app/main.py` — initializes FastAPI, sets CORS (localhost:3000/8081/19006 + `exp://192.168.*` for Expo Go), and registers all routers.

**Auth flow:** Supabase handles user creation and JWT issuance. `app/dependencies.py` validates tokens — fast-path via local JWT decode using `SUPABASE_JWT_SECRET`, fallback via Supabase network call. `CurrentUser` and `AsyncSessionDep` are the two primary FastAPI dependency types used in routes.

**Database:** SQLAlchemy async sessions against PostgreSQL (Supabase). `app/db.py` holds the engine, `Base`, and `get_db` dependency. The `GUID` type in `db.py` is a cross-dialect UUID that works with both PostgreSQL (prod) and SQLite (tests) — use it for all UUID columns.

**Schema migrations:** Alembic manages all table changes. Tables are never created via `Base.metadata.create_all` in production — only via migrations. The `alembic/versions/` directory holds the migration history.

**Layer pattern:** `app/models/` → SQLAlchemy ORM models, `app/schemas/` → Pydantic v2 request/response models, `app/routes/` → FastAPI routers.

**Environment variables required** (`backend/.env`):
- `DATABASE_URL` — async PostgreSQL URL (`postgresql+asyncpg://...`)
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
- `SUPABASE_JWT_SECRET` — enables fast local JWT validation

### Testing

Tests use **SQLite in-memory** for the database but **real Supabase Auth** for user creation (conftest creates actual Supabase users via the admin client). A live Supabase connection is required to run tests. Test fixtures: `test_engine` → `test_session` → `test_user` → `auth_headers`.

---

## Frontend (`Frontend-For-APP/`)

### Commands

```bash
# From Frontend-For-APP/
npm start          # starts Expo dev server
npm run android    # Android emulator
npm run ios        # iOS simulator
```

### Architecture

**Routing:** Expo Router (file-based). `app/_layout.jsx` is the root layout — it manages auth state, redirects unauthenticated users to `/`, and authenticated users away from auth screens. The `(tabs)/` group uses a swipeable top-tab navigator with the tab bar hidden (custom `BottomNav` component handles navigation).

**Auth guard note:** `app/_layout.jsx` currently contains a `removeToken()` call on startup (dev debug code) that forces the login screen every launch. Remove it before shipping.

**State management:** Zustand with two stores in `stores/`:
- `workoutStore.js` — active workout session, persisted to AsyncStorage so workouts survive app restarts
- `routineStore.js` — routine state

**API layer:** `lib/api.jsx` exports `apiFetch` and `getAuthHeader`. `lib/workoutApi.jsx` contains all workout/routine/exercise API calls. Token stored via `expo-secure-store` (native) or `localStorage` (web) via `lib/tokenStorage.jsx`. API base URL: `https://gym-community-app.onrender.com`.

**Key UI patterns:**
- `app/_components/` — shared components (Header, BottomNav, ActiveWorkoutMiniWidget, ExerciseConfigSheet, ScreenContainer)
- `app/_dashboardCom/` — dashboard-specific widgets
- `ActiveWorkoutMiniWidget` renders globally (in root layout) when `workoutStore.isActive` is true and user is not on the active workout screen

---

## Data Model (key relationships)

```
User (Supabase Auth ID) → UserProfile (1:1)
User → Routines (1:Many)  →  RoutineExercises
User → WorkoutLogs (1:Many) → WorkoutLogExercises → WorkoutLogSets
ExerciseLibrary (seeded) ← referenced by both RoutineExercises and WorkoutLogExercises
SeededWorkout → SeededWorkoutExercise → ExerciseLibrary
```

Social features (follow, feed, likes, comments) are planned but not yet implemented; `Follow` model exists but routes are incomplete.
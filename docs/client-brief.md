# Angles App — Client Brief

## What is this?
A personal workout tracking app. Users can log workouts, 
build custom routines, browse preset workout plans, and 
track their progress over time.

## Tech Stack
- Backend: FastAPI (Python), SQLAlchemy 2.0 async, Supabase (PostgreSQL), Render.com
- Frontend: React Native / Expo
- Auth: Supabase Auth (JWT)
- Storage: Supabase Storage (workout-media, workout_covers, avatars buckets)
- Package manager: uv (backend), npm (frontend)

## Current State
- Backend deployed on Render at https://gym-community-app.onrender.com
- Frontend running on Expo (React Native)
- Core features built but several bugs remain
- Demo is upcoming for a university course

## Core Features
- User registration, login, onboarding
- Browse 9 seeded workout plans (Push, Pull, Legs, Upper, Lower, 
  Chest & Triceps, Back & Biceps, Shoulders & Arms, Core & Abs)
- Exercise library with 855 exercises and fuzzy search with filters
- Start an empty workout session
- Start a workout from a saved routine
- Log sets, reps, weight during active workout
- Save completed workout as a routine
- View workout history
- Personal records and exercise history
- Workout streak tracking

## Out of Scope (cut from MVP)
- Social feed
- Follow/unfollow
- Public/private workout posts
- Photo/video upload on workout posts
- User search
- Copying other users' workouts
- Push notifications
- Email confirmation (disabled for demo)

## Known Issues
- save-as-routine from seeded workouts has a TypeError (reps int vs string)
- Profile screen over-fetching API calls
- Active workout exercise saving intermittently broken

## Team
- Danny (backend lead) — FastAPI, SQLAlchemy, Supabase
- Omar (frontend) — React Native / Expo
- Alberto (devops/frontend)
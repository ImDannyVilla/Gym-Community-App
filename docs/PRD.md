# PRD: Angles App Demo Readiness

GitHub issue: https://github.com/ImDannyVilla/Gym-Community-App/issues/92

## Problem Statement

The Angles App has a university course demo in 2 days. Several bugs block the core demo flow (app forces logout on every launch, avatar upload silently fails, saving a seeded workout as a routine crashes), and two core features listed in the brief — exercise history and workout streak — are either unbuilt or unwired on the frontend. If unaddressed, the evaluator will see a login loop on app open, broken profile photo upload, and missing engagement stats.

## Solution

Fix the four bugs blocking the demo flow, wire up the streak stat already computed on the backend, and build the exercise history feature (dedicated screen + in-workout last-session preview) so all advertised core features are demonstrable end-to-end.

## User Stories

1. As a user, I want the app to remember my login between sessions, so that I don't have to log in every time I open the app.
2. As a user, I want my profile photo to upload and persist correctly, so that my avatar is visible on my profile during the demo.
3. As a user, I want to save a seeded workout plan as a personal routine without an error, so that I can reuse preset programs.
4. As a user, I want the profile screen to load quickly when I navigate to it, so that I'm not waiting on a spinner mid-demo.
5. As a user, I want to see my current workout streak on my profile, so that I can see a measure of my consistency.
6. As a user, I want to tap an exercise and see my full history for that exercise, so that I can track my progress over time.
7. As a user, I want to see what weight and reps I lifted for an exercise in my last session while I'm actively working out, so that I know what to aim for.
8. As a user, I want the exercise history screen to show date, sets, reps, and weight for each past session, so that I can compare performance across sessions.
9. As a user, I want the last-session preview in the active workout to appear without navigating away, so that my workout flow is not interrupted.
10. As a user, I want the streak on my profile to update after I complete a workout, so that I see an accurate current streak.
11. As a user, I want my profile stats (completed workouts, sets, minutes, streak) to reflect my real data, so that the profile screen feels personalised and accurate.
12. As a user, I want the exercise history to be reachable from the exercise detail view, so that I can look up my past performance before adding an exercise to a workout.
13. As a user, I want saving a seeded workout as a routine to preserve the exercise order, sets, and rep targets, so that the routine is a faithful copy of the preset plan.

## Implementation Decisions

**Modules to modify:**

- **Auth persistence module** (`_layout.jsx`) — Remove the `removeToken()` call that runs on every app startup. This is a one-line deletion of a dev debug block. → Issue #93

- **Avatar upload module** (`profile.jsx` + a new upload utility) — Before calling `PUT /users/me/profile`, upload the selected image to the Supabase Storage `avatars` bucket using the Supabase JS client, then pass the resulting public URL to the profile update call. The bucket already exists at the Supabase project. → Issue #96

- **Workout-to-routine conversion** (backend route handling seeded workout save) — The `reps` field on `SeededWorkoutExercise` is stored as an integer. The routine creation path must cast or handle it consistently so no TypeError is thrown. Fix is in the backend route that converts a seeded workout into a `RoutineExercise`. → Issue #94

- **Profile data fetching module** (`profile.jsx`) — Replace the unconditional `useFocusEffect` fetch with a guarded fetch: only re-fetch if data is empty or if a flag indicates a workout was just completed. The `workoutStore` already persists session state and can provide this signal. → Issue #95

- **Streak display** (`profile.jsx`) — Add a call to `GET /workout-logs/streak` inside `loadProfileData`. Display the `current_streak` value in the existing "My Progress" stats grid. The styles (`streakStatsRow`, `statBox`) are already defined in the stylesheet. → Issue #99

- **Exercise history screen** (new screen) — A new screen reachable from `exercise-detail`. Calls `GET /exercise/{id}/history`. Displays a list of past sessions with date, sets, reps, and weight per set. No write operations. → Issue #97

- **Last-session preview in active workout** (`activeWorkout.jsx` or `ExerciseConfigSheet.jsx`) — When an exercise is added or expanded in the active workout, fetch and display the most recent session entry from `GET /exercise/{id}/history`. Renders inline as a compact read-only row (e.g. "Last time: 3×10 @ 60kg"). No navigation required. → Issue #98

**API contracts (all existing, no changes needed):**
- `GET /workout-logs/streak` → `{ current_streak, longest_streak, total_workouts }`
- `GET /exercise/{id}/history` → list of past sessions with sets/reps/weight

**Schema changes:** None.

## Testing Decisions

Good tests verify external behavior through the public interface — what the user sees or what the API returns — not implementation details like internal state variables or which helper function was called.

**Modules to test:**

- **Workout-to-routine conversion (backend)** — The existing `test_save_as_routine.py` is the prior art. Add a test case: given a seeded workout with integer `reps`, saving it as a routine should succeed and the resulting routine should have the correct rep targets.

- **Streak calculation (backend)** — Already tested in `test_streak_calculation.py`. Verify that completing a workout increments the streak. No new tests needed unless the wire-up exposes a gap.

- **Exercise history endpoint (backend)** — Prior art: `test_exercise_history.py`. Confirm the endpoint returns correct fields (`date`, `sets`, `reps`, `weight`) for a user who has logged that exercise.

**Not tested (frontend-only changes):**
- `removeToken` removal, avatar upload flow, profile fetch guard, streak display, and last-session preview are all UI/integration concerns best verified manually during demo rehearsal, not unit tested.

## Out of Scope

- Social feed, follow/unfollow, public workout posts, user search, push notifications — all cut from MVP per the brief.
- Fixing the active workout sequential-save race condition — mitigated by the Render cron job keeping the server warm; acceptable risk for the demo.
- Profile photo cropping or compression beyond what `expo-image-picker` provides.
- Personal records leaderboard or cross-user comparisons.

## Further Notes

- The Render backend is on a free tier kept warm by a cron job pinging every 10 minutes. Do not remove the cron job before the demo.
- The `community.jsx` tab safely redirects to the workouts tab — no action needed.
- The `explore.jsx` screen is actually the seeded workout browser — it is functional and in scope.
- The `removeToken()` removal must be the first commit — every other task depends on the app staying logged in across restarts.

## Issue Breakdown

| Issue | Title | Blocked by |
|-------|-------|------------|
| #93 | Remove auth persistence debug code | None |
| #94 | Fix TypeError when saving seeded workout as routine | None |
| #95 | Fix profile screen over-fetching on every tab focus | None |
| #96 | Fix avatar upload to use Supabase Storage | None |
| #97 | Build exercise history screen from exercise detail | None |
| #98 | Show last-session preview per exercise in active workout | None |
| #99 | Wire workout streak stat to profile stats grid | #95 |

/to# PRD: Sprint 3 — Profile Social, Feed Detail & UX Polish

## Problem Statement

Users who follow each other on the app have no way to see who follows them or browse the follower/following lists. When browsing the community feed, tapping a post does nothing — there is no way to view the full exercise breakdown of someone else's workout. In the active workout screen, the middle column shows target rep ranges from the routine definition, which is less useful during a live session than knowing what weight and reps were lifted last time for that exact set. Workout history and community post detail views show exercise names but no visual gif thumbnail, making it harder to identify exercises at a glance. Finally, the My Routines screen can only be refreshed by navigating away and back — there is no manual refresh gesture.

## Solution

Add follower/following counts to both own and public profile screens with tappable navigation to a dedicated list screen. Build a full-screen post detail view reachable by tapping any feed card, showing every exercise, set, rep, and weight for that public workout. Replace the Target column in the active workout with per-set previous performance. Surface exercise gif thumbnails in workout history detail and community post detail views. Add pull-to-refresh to the My Routines screen.

## User Stories

1. As a user, I want to see my follower and following counts on my profile screen, so that I know how many people are connected to me.
2. As a user, I want to tap my followers count and see a list of everyone who follows me, so that I can identify my followers.
3. As a user, I want to tap my following count and see a list of everyone I follow, so that I can review who I'm following.
4. As a user viewing someone else's public profile, I want to tap their follower count and see the list, so that I can discover other people in the community.
5. As a user viewing someone else's public profile, I want to tap their following count and see who they follow, so that I can find people they recommend.
6. As a user on the followers/following list screen, I want to see each person's avatar, username, and full name, so that I can identify them.
7. As a user on the followers/following list screen, I want a follow/unfollow button next to each person, so that I can manage my follow relationships without navigating away.
8. As a user browsing the community feed, I want to tap a post card and see the full workout detail, so that I can see exactly which exercises were done, with what weight and reps.
9. As a user on the post detail screen, I want to see the workout name, date, duration, exercise count, and total sets, so that I can understand the workout at a glance.
10. As a user on the post detail screen, I want to see each exercise listed with its gif thumbnail, so that I can identify the movement visually.
11. As a user on the post detail screen, I want to see every set for each exercise showing set number, weight, and reps, so that I can understand the exact training load.
12. As a user on the post detail screen, I want a Save to Library button, so that I can copy the workout as a routine in my own library.
13. As a user on the post detail screen, I want the poster's avatar, username, and timestamp shown at the top, so that I know whose workout I'm looking at.
14. As a user actively working out, I want the middle column of each set row to show the weight and reps I did for that exact set number last session, so that I have a specific target to beat.
15. As a user actively working out, I want the Previous column to show "—" when I have no history for that set number, so that I'm not confused by empty data.
16. As a user actively working out, I want the column header to read "PREVIOUS" instead of "TARGET", so that the label matches what the column actually shows.
17. As a user viewing my own workout history detail, I want to see a gif thumbnail next to each exercise name, so that I can quickly identify each movement.
18. As a user viewing a public post detail, I want to see a gif thumbnail next to each exercise name, so that I can identify movements I might not recognise.
19. As a user on the My Routines screen, I want to pull down to refresh the list, so that I can manually force a fresh fetch after making changes elsewhere.
20. As a user pulling to refresh My Routines, I want both the routines list and the weekly stats to refresh together, so that the whole screen is current after one gesture.

## Implementation Decisions

### Followers/Following List Screen

- A new screen accepts a `userId` param and a `type` param (`followers` or `following`), calls the appropriate existing API endpoint, and renders results as a vertically scrolling list.
- The `UserRow` component built for the user search screen is reused directly — it already handles avatar, username, full name, and an optimistic follow/unfollow button.
- Both the authenticated user's own profile screen and the public profile screen make the follower and following count labels tappable, navigating to the new list screen with the relevant user ID and type.
- No new backend work is required — `GET /users/{user_id}/followers` and `GET /users/{user_id}/following` already exist and are already wired in the social API module.

### Post Detail Screen

- A new backend endpoint `GET /workout-logs/public/{log_id}` returns the full workout log including all exercises and sets for any log where `is_public = true`. No authentication is required. Returns 404 if the log does not exist or is not public. This mirrors the naming of the existing public feed endpoint and keeps ownership enforcement intact on the standard detail endpoint.
- A new full push screen (`post-detail`) receives a `logId` route param, calls the new public endpoint, and renders poster info, workout stats, and a per-exercise breakdown with gif thumbnails and set rows.
- No PR badges are shown on the post detail screen. PR detection is semantically meaningful only against the viewing user's own records; showing it on someone else's workout creates confusion regardless of whose records are used.
- The Save to Library button calls the existing `POST /routines/{log_id}/copy` endpoint, which already validates public access and prevents copying your own log.
- `WorkoutPostCard` gains a tap handler on the card body (workout name, stats chips, media, caption) that navigates to the post detail screen. The follow and Save to Library buttons intercept taps independently and do not trigger the card-level navigation.

### Previous Column in Active Workout

- The `SetRow` component's middle column logic is simplified: always render the formatted previous set value. The conditional that prioritised target rep ranges when `target_reps_min` was present is removed.
- The column header label changes from `TARGET` to `PREVIOUS`.
- The `previousSet` prop is already computed correctly from exercise history and passed into each `SetRow` — no changes to data fetching or props are needed.
- The existing `formatPreviousSet` helper already formats as `weight × reps` and returns `"—"` when the set is absent.

### Exercise Gifs in Detail Views

- The own workout history detail screen adds a gif thumbnail image alongside each exercise name in the exercise card header. The `gif_url` field is already present on `WorkoutLogExercise` and already returned by the existing detail endpoint.
- The new post detail screen renders the same thumbnail pattern for each exercise row.
- The compact `WorkoutPostCard` in the feed is not modified — per-exercise rows do not belong on a summary card.

### Pull-to-Refresh on My Routines

- A `refreshing` state variable is added to the workouts screen. A `RefreshControl` component is attached to the existing `ScrollView`, wired to the existing `fetchData` function.
- `fetchData` already fetches routines and streak stats together in a single `Promise.all` and updates both the Zustand cache and AsyncStorage — no changes to the fetch logic are needed.

### Schema Changes

None. All required fields (`gif_url`, `is_public`, `followers_count`, `following_count`, exercises and sets on workout logs) already exist in the database and are returned by existing endpoints.

## Testing Decisions

Good tests cover external behavior visible to the API consumer or user — not internal state variables, helper functions, or which line of code ran. Tests should remain valid after internal refactors.

### Backend

- **`GET /workout-logs/public/{log_id}`**: Integration test verifying that a public log returns status 200 with full exercises and sets; a private log returns 404; a non-existent log returns 404. Prior art: existing workout log tests in `test_workout_logs.py` which follow the same fixture pattern (`client`, `test_session`, `auth_headers`).

### Frontend

All frontend changes are validated manually:
- Followers/following list: tap count → correct list loads → follow button updates optimistically.
- Post detail: tap feed card → correct exercises appear → Save to Library creates a routine.
- Previous column: start a workout after completing one → previous set values appear per set number.
- Gifs: open workout history detail and post detail → thumbnail visible next to each exercise.
- Pull-to-refresh: pull down on routines screen → spinner shows → list updates.

## Out of Scope

- PR badges on public post detail screens.
- Followers/following lists on any screen other than own profile and public profile.
- Liking, commenting on, or bookmarking community posts.
- Video support in the post detail view.
- Pagination on the followers/following list screen.
- Any changes to the compact `WorkoutPostCard` feed card layout.

## Further Notes

- The new `GET /workout-logs/public/{log_id}` endpoint should be placed before the existing `GET /workout-logs/{log_id}` route registration to avoid any path ambiguity, consistent with the pattern used for `GET /workout-logs/public` feed endpoint.
- The `POST /routines/{log_id}/copy` endpoint already blocks copying your own workout log (returns 400). The Save to Library button on the post detail screen should handle this gracefully — hide or disable the button when the viewing user is the post author.
- `workout-summary.jsx` already renders exercise gif thumbnails — no changes needed there.

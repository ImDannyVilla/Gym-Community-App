# PRD — Pre-Demo Bug Fixes (Batch F)

**Context:** These are three frontend-visible bugs surfaced via QA from a teammate before the final presentation demo. None of them are demo-blockers individually, but each is small enough that fixing them tightens the demo. Routine value persistence in particular is the most user-visible.

**Scope rule:** Investigate first, propose a plan, get acknowledgment, then implement. One commit per bug. Reference each issue with `Closes #<num>` in the commit message. No `Co-Authored-By: Claude` trailer. Do not push or open PRs. Stop after the third commit.

**Out of scope:** Anything not listed below. Do not refactor adjacent code. Do not "while you're here" any other findings — surface them in a comment at the end of the work, do not act on them.

---

## Bug F1 — Saved routine target values don't carry over when starting the routine

### Symptom
A user creates a routine and customizes each exercise with target sets, target reps (min/max), and target weight (lbs). The routine saves successfully — the values are confirmed in the database. When the user later starts that saved routine, the target reps and target weight do **not** appear on the active workout screen. Sets are pre-populated based on `target_sets`, but their reps and weight fields show empty/default values rather than the saved targets.

### Confirmed via partner QA
- Data IS being written correctly. The `routine_exercises` table contains `target_sets`, `target_reps_min`, `target_reps_max`, and `target_weight` populated for each row.
- The bug is in the **read path or rendering**, not the write path.

### Likely investigation areas
1. **`getRoutine(routineId)` API response shape** — does the backend serialize `target_reps_min`, `target_reps_max`, and `target_weight` in the response? Check the Pydantic schema for the routine-fetch endpoint and confirm those fields are included in the output. The audit (Flow 5 bug #1) noted that backend `Routine.exercises` lacks an `order_by` — while investigating, confirm the response also includes target values, not just the exercise IDs and order.
2. **`startNewWorkout` / `confirmStartWorkout` flow in `(tabs)/workouts.jsx`** — when starting a routine, the frontend calls `startWorkout` (creates a `WorkoutLog`) and `getRoutine` (fetches routine details), then maps over routine exercises to build the in-memory exercise instances. Check whether `target_reps_min`, `target_reps_max`, and `target_weight_lbs` are being passed through into the exercise object that gets written to the Zustand store.
3. **`activeWorkout.jsx` rendering** — even if the values reach the store, are they being read into the per-set input fields? The audit noted that `ExerciseCard` doesn't render target reps/weight visibly, which is consistent with this report. Check whether the per-set `reps` and `weight` fields default to the routine's target values, or default to empty.

### Specifically what to determine
- Are the target values present in the API response from `getRoutine`?
- Are they present in the Zustand store after `startWorkout` runs?
- Are they being rendered on the active workout screen?

The bug is at whichever step they first go missing. Find that step, fix it.

### Acceptance criteria
- [ ] User creates a routine with target reps and weight per exercise. Saves it.
- [ ] User starts that saved routine.
- [ ] Each set in the active workout screen shows the saved target reps and target weight as the default value (editable, not locked).
- [ ] If the routine has multiple sets per exercise, each set inherits the same target values.
- [ ] No regression on starting an empty workout (no routine) — those workouts continue to start with empty values.

### Notes
- Check the backend response with curl or the FastAPI docs UI before assuming the frontend is at fault. If the API isn't returning the fields, the fix is backend-side (schema serialization). If the API returns them but the frontend doesn't use them, fix is frontend-side.
- The screenshot confirming data is in the DB is at the bottom of this doc — the agent doesn't need to re-verify the write path.

---

## Bug F2 — Workout duration not displayed on post-detail screen

### Symptom
When a user taps one of their workouts from the Profile screen to open the post-detail view, the workout's duration is missing from the display. Other workout details (exercises, sets, volume, photo) appear correctly. Duration is calculated and stored correctly — it just isn't rendered.

### Likely investigation areas
1. **`post-detail.jsx` (or `workout-log-detail.jsx`, depending on which screen Profile routes to) rendering** — check whether `duration` (or `duration_seconds` / `duration_minutes`, whatever field name is used) is destructured from the workout log object and shown in the UI.
2. **Backend response** — confirm the `GET /workout-logs/{id}` endpoint includes the duration field. The save flow (`save-workout.jsx:130-136`) sets `duration` when calling `updateWorkoutLog`, so it should be persisted; verify the read endpoint returns it.

### Acceptance criteria
- [ ] Tapping a saved workout from Profile opens the detail screen with duration visible (e.g., "1h 12m" or "72 min").
- [ ] Duration is formatted human-readably, not raw seconds.
- [ ] If a workout's duration is null (legacy data, abandoned save), the field is hidden gracefully — no "null" or "NaN" rendered.
- [ ] Same fix applies to the Community post-detail screen if it shares the component (it should — `WorkoutPostCard` is the shared component per Flow 3 of the original PRD).

### Notes
- This is likely a one-line render fix. Don't over-engineer.
- Check `post-detail.jsx` AND `workout-log-detail.jsx` — Profile may route to one and Community to the other (per the audit notes on Flow 9 bug #1).

---

## Bug F3 — Follow button shows "Follow" for already-followed users when found via search

### Symptom
On the Community screen, if a user uses the search bar to look up someone they already follow, the search-result card shows a "Follow" button instead of "Following." The follow state in the database is correct — the search response just doesn't reflect it.

### Related audit findings
- Flow 10 bug #3 noted that there's no `is_following` boolean returned by `/users/{username}` or related endpoints. Frontend currently computes `isFollowing` by fetching the entire following list and `.some()`-checking it.
- This bug is the user-facing surface of that gap: search results don't get cross-referenced against the following list.

### Likely investigation areas
1. **Search endpoint response** — does the user-search response include any follow-state info? If not, the frontend has to compute it.
2. **Search result rendering on Community screen** — does the search-result card receive the current user's following list as a prop, and check membership before rendering the button label? Probably not, hence the bug.
3. **Quick fix vs proper fix:**
   - **Quick fix (frontend-only):** when search results render, cross-reference against the existing `followingIds` list that Community already fetches, and pass the resolved `isFollowing` boolean down to each card.
   - **Proper fix (backend):** add `is_following` to the user-search and user-lookup response payloads, computed against the authenticated user. Out of scope for this PRD — too risky pre-demo.

### Acceptance criteria
- [ ] User opens Community, searches for a username they already follow.
- [ ] The search result shows the "Following" state correctly, not "Follow."
- [ ] Tapping the button unfollows them (existing behavior preserved).
- [ ] No regression on searching for users they don't follow — those still show "Follow."

### Notes
- Take the **quick fix** route. The proper fix touches the backend and adds risk we can't absorb before the demo.
- The known sync issue between Community feed cards and post-tap follow actions (also flagged in QA) is **out of scope** for this PRD. That's a separate, harder bug about optimistic state propagation across multiple cards from the same user. Do not attempt.

---

## Process

1. For each bug, post a one-paragraph plan: root cause hypothesis, file(s) to change, and proposed fix. Wait for acknowledgment before coding.
2. Implement one bug at a time, in order F1 → F2 → F3. F1 is the heaviest; do it first while context is fresh.
3. One commit per bug. Reference the GitHub issue with `Closes #<num>`. No co-author trailer.
4. After all three are committed, post a summary of what was done and any out-of-scope issues you noticed but did not act on.

## Reference: routine_exercises data confirmation

The screenshot below confirms the data is being written correctly. `target_sets`, `target_reps_min`, `target_reps_max`, and `target_weight` columns are populated for routine exercises. The bug for F1 is downstream of the write path.

(Screenshot: `routine_exercises` table in Supabase showing populated target columns for multiple exercises — Push Up to Side Plank, All Fours Quad Stretch, Lower Back Curl, Seated Cable Rows, Concentration Curls, Dumbbell Alternate Bicep Curl, Pullups, One Arm Dumbbell Row, Wide-Grip Lat Pulldown, Barbell Curl, Pushups (Close and Wide Hand Positions), Incline Dumbbell Curl, Bent Over Barbell Row.)
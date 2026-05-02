# Sprint 3 — Profile Social + Feed Detail + UX Polish

## Features to add

1. Show followers and following counts on profile screen
   - Tappable to see the list of followers/following users

2. Community feed post detail
   - User taps a post in the feed → opens full workout detail
   - Shows every exercise, sets, reps, weight
   - Shows PR badges if any were hit that workout
   - Button to save that workout as a routine to their own library
   - Uses existing POST /workout-logs/{id}/copy endpoint

3. Replace "Target" column in active workout set rows with "Previous"
   - Shows last performance for that exact set number
   - Format: "25 x 6" (weight x reps)
   - If no previous data for that set number show "-"
   - Pulls from GET /exercises/{exercise_id}/history

4. Show exercise gif in workout history and community posts
   - Every exercise row in workout logs and feed posts 
     must show the gif_url thumbnail from the DB

5. Pull-to-refresh on My Routines screen
   - User pulls down to manually refresh the routines list
   - Fetches fresh from GET /routines/me
   - Updates cache after refresh
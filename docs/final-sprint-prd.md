# PRD: Sprint 2 — Social Features

## Problem Statement

The Angles App has full workout tracking but no way for users to connect with others. Users cannot find friends, follow their activity, or share their workouts publicly. The backend already has follow/unfollow, public profile, user search, and public workout log endpoints built but not wired to the frontend. Without social features the app is a solo tool with no community layer.

## Solution

Wire the existing backend social endpoints to the frontend: build user search, public profile view, follow/unfollow UI, a post-workout sharing flow, and a social feed showing public posts from followed users.

## User Stories

1. As a user, I want to search for other users by username so that I can find people I know.
2. As a user, I want to view another user's public profile so that I can see their activity and stats.
3. As a user, I want to follow and unfollow other users so that their workouts appear in my feed.
4. As a user, I want to see how many followers and following a user has on their profile so that I can gauge their activity.
5. As a user, I want to post my completed workout publicly with a photo/video and caption so that I can share my progress.
6. As a user, I want to toggle whether a workout post is public or private so that I control what I share.
7. As a user, I want to view a social feed of public workout posts from users I follow so that I stay motivated by my community.
8. As a user, I want to copy a public workout from the feed as one of my own routines so that I can try programs other people are doing.

## Implementation Decisions

**Modules to build or modify:**

- **User search screen** (new screen) — Calls `GET /users/search?q=`. Renders a list of matching users with avatar, username, and a follow button. Reachable from the Community tab.

- **Public profile screen** (new screen) — Calls `GET /users/{username}`. Displays avatar, username, bio, follower/following counts, and a scrollable list of that user's public workout posts. Includes a follow/unfollow button that calls `POST /users/{username}/follow` or `DELETE /users/{username}/follow`.

- **Follow/unfollow UI** — Follow button component shared between the search results list and the public profile screen. Optimistically updates local state; rolls back on API error.

- **Post-workout share screen** (new screen) — Shown after workout completion when the user opts in. Calls `PUT /workout-logs/{id}` with `is_public: true`, `caption`, and optionally `media_url` / `media_type`. Media upload goes to Supabase Storage before the PUT call. Skippable — user can dismiss to keep the log private.

- **Social feed screen** (new screen or existing Community tab) — Calls `GET /workout-logs/feed` (to be confirmed or built). Renders a vertically scrollable list of public workout posts from followed users. Each card shows avatar, username, workout name, caption, media (if present), and a "Copy as routine" action that calls `POST /workout-logs/{id}/copy`.

- **`is_public` toggle** — Accessible from the post-workout share screen and from the workout log detail view.

**API contracts (existing backend endpoints):**
- `POST /users/{username}/follow` — follow a user
- `DELETE /users/{username}/follow` — unfollow a user
- `GET /users/{username}` — public profile
- `GET /users/search?q=` — search users by username
- `GET /workout-logs/me` — user's own logs (`is_public` field present)
- `PUT /workout-logs/{id}` — update log (`is_public`, `caption`, `media_url`, `media_type`)
- `POST /workout-logs/{id}/copy` — copy public log as a routine

**Schema changes:** None expected — all required fields (`is_public`, `caption`, `media_url`, `media_type`) already exist on `WorkoutLog`.

## Testing Decisions

- **Follow/unfollow (backend)** — Verify that following a user is reflected in follower count and that unfollowing reverses it. Verify duplicate follows are idempotent.
- **User search (backend)** — Verify results are scoped to public profiles and match the query string.
- **Public profile (backend)** — Verify only public logs appear; private logs are excluded.
- **Copy-as-routine (backend)** — Verify the copied routine preserves exercise order, sets, and rep targets from the source log.
- **Frontend flows** — Verified manually: search → view profile → follow → feed shows post → copy as routine.

## Out of Scope

- Likes and comments on workout posts.
- Push notifications for follows or feed activity.
- Direct messaging.
- Personal records leaderboard or cross-user comparisons.
- Algorithmic feed ranking — chronological only for MVP.

## Issue Breakdown

| Issue | Title | Blocked by |
|-------|-------|------------|
| TBD | User search screen | None |
| TBD | Public profile screen | None |
| TBD | Follow/unfollow UI | None |
| TBD | Post-workout share screen | None |
| TBD | Social feed screen | Follow/unfollow |
| TBD | Copy public workout as routine (frontend) | Social feed screen |

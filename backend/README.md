# Gym Community App - Backend API Doc

**Live API:** https://gym-community-app.onrender.com

**API Documentation:** https://gym-community-app.onrender.com/docs

**Health Check:** https://gym-community-app.onrender.com/health

---

This documentation provides a complete reference for all backend API endpoints, including request/response schemas, authentication requirements, and the application flow.

---

## Table of Contents

- [Authentication](#authentication)
- [Application Flow](#application-flow)
- [API Endpoints Reference](#api-endpoints-reference)
  - [1. Authentication](#1-authentication-auth)
    - [POST /auth/register](#post-authregister)
    - [POST /auth/login](#post-authlogin)
    - [POST /auth/onboarding](#post-authonboarding)
    - [POST /auth/request-password-reset](#post-authrequest-password-reset)
    - [POST /auth/update-password](#post-authupdate-password)
    - [POST /auth/resend-confirmation](#post-authresend-confirmation)
  - [2. User Profile](#2-user-profile-users)
    - [GET /users/me](#get-usersme)
    - [PUT /users/me/profile](#put-usersmeprofile)
    - [GET /users/search](#get-userssearchqquerylimitlimit)
    - [GET /users/{username}](#get-usersusername)
    - [PUT /users/me/password](#put-usersmepassword)
    - [POST /users/change-email](#post-userschange-email)
  - [3. Exercise Library](#3-exercise-library-exercises)
    - [GET /exercises/search](#get-exercisessearch)
    - [GET /exercises/body-parts](#get-exercisesbody-parts)
    - [GET /exercises/equipment](#get-exercisesequipment)
    - [GET /exercises/{exercise_id}/history](#get-exercisesexercise_idhistory)
  - [4. Routines](#4-routines-routines)
    - [POST /routines/](#post-routines)
    - [GET /routines/me](#get-routinesme)
    - [GET /routines/{routine_id}](#get-routinesroutine_id)
    - [PUT /routines/{routine_id}](#put-routinesroutine_id)
    - [DELETE /routines/{routine_id}](#delete-routinesroutine_id)
    - [POST /routines/{routine_id}/exercises](#post-routinesroutine_idexercises)
    - [POST /routines/{log_id}/copy](#post-routineslog_idcopy)
  - [5. Seeded Workouts](#5-seeded-workouts-workouts)
    - [GET /workouts/seeded](#get-workoutsseeded)
    - [GET /workouts/seeded/{workout_id}](#get-workoutsseededworkout_id)
  - [6. Workout Logs](#6-workout-logs-workout-logs)
    - [POST /workout-logs/](#post-workout-logs)
    - [GET /workout-logs/me](#get-workout-logsme)
    - [GET /workout-logs/{log_id}](#get-workout-logslog_id)
    - [PUT /workout-logs/{log_id}](#put-workout-logslog_id)
    - [DELETE /workout-logs/{log_id}](#delete-workout-logslog_id)
    - [POST /workout-logs/{log_id}/exercises](#post-workout-logslog_idexercises)
    - [DELETE /workout-logs/{log_id}/exercises/{exercise_id}](#delete-workout-logslog_idexercisesexercise_id)
    - [POST /workout-logs/{log_id}/exercises/{exercise_id}/sets](#post-workout-logslog_idexercisesexercise_idsets)
    - [PUT /workout-logs/{log_id}/exercises/{exercise_id}/sets/{set_id}](#put-workout-logslog_idexercisesexercise_idsetssset_id)
    - [DELETE /workout-logs/{log_id}/exercises/{exercise_id}/sets/{set_id}](#delete-workout-logslog_idexercisesexercise_idsetssset_id)
    - [POST /workout-logs/{log_id}/start-from-routine](#post-workout-logslog_idstart-from-routine)
- [Common Workflows](#common-workflows)
- [Data Relationships](#data-relationships)
- [Not Yet Implemented (Social Features)](#not-yet-implemented-social-features)
- [Error Handling](#error-handling)
- [Security Notes](#security-notes)
- [Best Practices for Frontend](#best-practices-for-frontend)
- [Summary](#summary)

---

## Authentication

All endpoints except those in the **Auth** section require authentication via Bearer token.

**Header Format:**
```
Authorization: Bearer <access_token>
```

The token is obtained from the `/auth/login` or `/auth/register` endpoints.

---

## Application Flow

### User Journey Overview

```
1. Registration -> 2. Email Confirmation -> 3. Login -> 4. Onboarding -> 5. Main App
```

#### Phase 1: Registration & Authentication
1. User registers with email/password (`POST /auth/register`)
2. User receives confirmation email (Supabase handles this)
3. User confirms email via link
4. User logs in (`POST /auth/login`)
5. Backend returns token + `is_onboarded` flag

#### Phase 2: Onboarding (First-Time Setup)
If `is_onboarded = false`, redirect to onboarding:
1. User completes profile (`POST /auth/onboarding`)
   - Sets username (required)
   - Sets full name, gym level, avatar (optional)
2. User is now ready to use the app

#### Phase 3: Main App Usage

**A. Workout Planning**
1. Browse seeded workouts (`GET /workouts/seeded`)
2. View workout details (`GET /workouts/seeded/{id}`)
3. Create custom routines (`POST /routines/`)
4. Browse exercise library (`GET /exercises/search`)
5. View exercise history (`GET /exercises/{id}/history`)

**B. Workout Execution**
1. Start workout from routine (`POST /workout-logs/`)
2. Add exercises during workout (`POST /workout-logs/{id}/exercises`)
3. Log sets in real-time (`POST /workout-logs/{id}/exercises/{ex_id}/sets`)
4. Complete workout (`PUT /workout-logs/{id}` with `completed_at`)

**C. Social Features (Planned)**
1. Make workout public (`PUT /workout-logs/{id}` with `is_public=true`)
2. Add caption/media (`PUT /workout-logs/{id}`)
3. Browse feed (not yet implemented)
4. Follow users (not yet implemented)
5. Like/comment (not yet implemented)

**D. Profile Management**
1. View own profile (`GET /users/me`)
2. Update profile (`PUT /users/me/profile`)
3. Search other users (`GET /users/search`)
4. View user profiles (`GET /users/{username}`)

---

## API Endpoints Reference

### 1. Authentication (`/auth`)

#### `POST /auth/register`
**Purpose:** Create a new user account  
**When to use:** Registration screen  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Password Requirements:**
- 8-20 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character
- No spaces

**Response:** `201 Created`
```json
{
  "message": "Registration successful. Please check your email to confirm your account."
}
```

---

#### `POST /auth/login`
**Purpose:** Authenticate user and get access token  
**When to use:** Login screen  
**Auth Required:** No

**Request Body:** (Form Data)
```
username: user@example.com  (email field)
password: SecurePass123!
```

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "is_onboarded": false
}
```

**Frontend Action:**
- Store `access_token` securely
- If `is_onboarded = false`, redirect to onboarding
- If `is_onboarded = true`, redirect to main app

---

#### `POST /auth/onboarding`
**Purpose:** Complete user profile setup after registration  
**When to use:** Onboarding screen (first-time users)  
**Auth Required:** Yes

**Request Body:**
```json
{
  "username": "johndoe123",
  "full_name": "John Doe",
  "gym_level": "Intermediate",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**Username Requirements:**
- 3-20 characters
- Alphanumeric only (no special characters)
- Must be unique

**Gym Level Options:**
- `"Beginner"`
- `"Intermediate"`
- `"Advanced"`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2026-04-19T10:00:00Z",
  "profile": {
    "id": "uuid",
    "user_name": "johndoe123",
    "full_name": "John Doe",
    "gym_level": "Intermediate",
    "bio": null,
    "avatar_url": "https://example.com/avatar.jpg",
    "followers_count": 0,
    "following_count": 0
  }
}
```

---

#### `POST /auth/request-password-reset`
**Purpose:** Send password reset email  
**When to use:** Forgot password screen  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If the email exists, a reset link will be sent."
}
```

---

#### `POST /auth/update-password`
**Purpose:** Reset password via email link  
**When to use:** Password reset screen (from email link)  
**Auth Required:** Yes (token from email link)

**Request Body:**
```json
{
  "new_password": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password successfully updated"
}
```

---

#### `POST /auth/resend-confirmation`
**Purpose:** Resend email confirmation link  
**When to use:** If user didn't receive confirmation email  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Confirmation email sent successfully"
}
```

---

### 2. User Profile (`/users`)

#### `GET /users/me`
**Purpose:** Get current user's profile  
**When to use:** Profile screen, app initialization  
**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "created_at": "2026-04-19T10:00:00Z",
  "profile": {
    "id": "uuid",
    "user_name": "johndoe123",
    "full_name": "John Doe",
    "gym_level": "Intermediate",
    "bio": "Fitness enthusiast",
    "avatar_url": "https://example.com/avatar.jpg",
    "followers_count": 150,
    "following_count": 200
  }
}
```

---

#### `PUT /users/me/profile`
**Purpose:** Update current user's profile  
**When to use:** Edit profile screen  
**Auth Required:** Yes

**Request Body:** (All fields optional)
```json
{
  "username": "newusername",
  "full_name": "John Smith",
  "gym_level": "Advanced",
  "bio": "Powerlifter | 500lb deadlift",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user_name": "newusername",
  "full_name": "John Smith",
  "gym_level": "Advanced",
  "bio": "Powerlifter | 500lb deadlift",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "followers_count": 150,
  "following_count": 200
}
```

---

#### `GET /users/search?q={query}&limit={limit}`
**Purpose:** Search users by username  
**When to use:** User search screen, follow suggestions  
**Auth Required:** Yes

**Query Parameters:**
- `q` (required): Search term
- `limit` (optional): Max results (default: 20)

**Example:** `GET /users/search?q=john&limit=10`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "john@example.com",
    "created_at": "2026-04-19T10:00:00Z",
    "profile": {
      "id": "uuid",
      "user_name": "johndoe123",
      "full_name": "John Doe",
      "gym_level": "Intermediate",
      "bio": "Fitness enthusiast",
      "avatar_url": "https://example.com/avatar.jpg",
      "followers_count": 150,
      "following_count": 200
    }
  }
]
```

---

#### `GET /users/{username}`
**Purpose:** Get any user's profile by username  
**When to use:** View other user's profile  
**Auth Required:** No

**Example:** `GET /users/johndoe123`

**Response:** `200 OK` (same structure as `/users/me`)

---

#### `PUT /users/me/password`
**Purpose:** Change password (while logged in)  
**When to use:** Settings screen  
**Auth Required:** Yes

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password updated successfully"
}
```

---

#### `POST /users/change-email`
**Purpose:** Change email address  
**When to use:** Settings screen  
**Auth Required:** Yes

**Request Body:**
```json
{
  "new_email": "newemail@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Email updated successfully"
}
```

---

### 3. Exercise Library (`/exercises`)

#### `GET /exercises/search`
**Purpose:** Search exercises with filters  
**When to use:** Exercise picker, routine builder  
**Auth Required:** No

**Query Parameters:**
- `q` (optional): Search by name
- `category` (optional): Filter by category (e.g., "chest", "back")
- `equipment` (optional): Filter by equipment (e.g., "barbell", "dumbbell")
- `target` (optional): Filter by target muscle
- `limit` (optional): Max results (default: 20, max: 50)

**Example:** `GET /exercises/search?q=bench&equipment=barbell&limit=10`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "exercise_id": "0001",
    "name": "Barbell Bench Press",
    "body_part": "chest",
    "target": "pectorals",
    "equipment": "barbell",
    "gif_url": "https://example.com/bench-press.gif",
    "secondary_muscles": "triceps, shoulders",
    "instructions": "Lie on bench, lower bar to chest, press up..."
  }
]
```

---

#### `GET /exercises/body-parts`
**Purpose:** Get all unique body parts for filter UI  
**When to use:** Populate filter dropdowns  
**Auth Required:** No

**Response:** `200 OK`
```json
[
  "chest",
  "back",
  "shoulders",
  "legs",
  "arms",
  "core"
]
```

---

#### `GET /exercises/equipment`
**Purpose:** Get all unique equipment types for filter UI  
**When to use:** Populate filter dropdowns  
**Auth Required:** No

**Response:** `200 OK`
```json
[
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight"
]
```

---

#### `GET /exercises/{exercise_id}/history`
**Purpose:** Get user's last performance for an exercise  
**When to use:** Show previous stats when starting an exercise  
**Auth Required:** Yes

**Example:** `GET /exercises/0001/history`

**Response:** `200 OK`
```json
{
  "exercise_id": "0001",
  "name": "Barbell Bench Press",
  "last_performed": "2026-04-15T14:30:00Z",
  "sets": [
    {
      "id": "uuid",
      "set_number": 1,
      "reps": 10,
      "weight_lbs": 135,
      "completed": true
    },
    {
      "id": "uuid",
      "set_number": 2,
      "reps": 8,
      "weight_lbs": 155,
      "completed": true
    }
  ]
}
```

**Error:** `404 Not Found` if user has never performed this exercise

---

### 4. Routines (`/routines`)

Routines are pre-planned workout templates that users create and reuse.

#### `POST /routines/`
**Purpose:** Create a new routine  
**When to use:** Routine builder screen  
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Push Day",
  "description": "Chest, shoulders, triceps",
  "is_public": false,
  "exercises": [
    {
      "exercise_id": "0001",
      "name": "Barbell Bench Press",
      "gif_url": "https://example.com/bench.gif",
      "category": "chest",
      "target": "pectorals",
      "equipment": "barbell",
      "order": 1,
      "target_sets": 4,
      "target_reps_min": 8,
      "target_reps_max": 12,
      "target_weight_lbs": 185,
      "notes": "Focus on form"
    },
    {
      "exercise_id": "0002",
      "name": "Dumbbell Shoulder Press",
      "gif_url": "https://example.com/shoulder.gif",
      "category": "shoulders",
      "target": "deltoids",
      "equipment": "dumbbell",
      "order": 2,
      "target_sets": 3,
      "target_reps_min": 10,
      "target_reps_max": 12,
      "target_weight_lbs": 50,
      "notes": null
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Push Day",
  "description": "Chest, shoulders, triceps",
  "is_public": false,
  "created_at": "2026-04-19T10:00:00Z",
  "exercises": [
    {
      "id": "uuid",
      "routine_id": "uuid",
      "exercise_id": "0001",
      "name": "Barbell Bench Press",
      "gif_url": "https://example.com/bench.gif",
      "category": "chest",
      "target": "pectorals",
      "equipment": "barbell",
      "order": 1,
      "target_sets": 4,
      "target_reps_min": 8,
      "target_reps_max": 12,
      "target_weight_lbs": 185,
      "notes": "Focus on form"
    }
  ]
}
```

---

#### `GET /routines/me`
**Purpose:** Get all routines for current user  
**When to use:** Routines list screen  
**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Push Day",
    "description": "Chest, shoulders, triceps",
    "is_public": false,
    "created_at": "2026-04-19T10:00:00Z"
  },
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Pull Day",
    "description": "Back and biceps",
    "is_public": false,
    "created_at": "2026-04-18T10:00:00Z"
  }
]
```

---

#### `GET /routines/{routine_id}`
**Purpose:** Get specific routine with all exercises  
**When to use:** View routine details, start workout from routine  
**Auth Required:** Yes

**Response:** `200 OK` (same structure as POST response)

**Note:** Returns routine if:
- User owns it, OR
- Routine is public

---

#### `PUT /routines/{routine_id}`
**Purpose:** Update routine metadata  
**When to use:** Edit routine screen  
**Auth Required:** Yes

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Push Day",
  "description": "New description",
  "is_public": true
}
```

**Response:** `200 OK` (full routine object)

---

#### `DELETE /routines/{routine_id}`
**Purpose:** Delete a routine  
**When to use:** Delete routine action  
**Auth Required:** Yes

**Response:** `204 No Content`

---

#### `POST /routines/{routine_id}/exercises`
**Purpose:** Add exercises to existing routine  
**When to use:** Edit routine - add exercises  
**Auth Required:** Yes

**Request Body:** (same as create routine, but only exercises array)
```json
{
  "exercises": [
    {
      "exercise_id": "0003",
      "name": "Tricep Pushdown",
      "order": 3,
      "target_sets": 3,
      "target_reps_min": 12,
      "target_reps_max": 15,
      "target_weight_lbs": 60
    }
  ]
}
```

**Response:** `201 Created` (full routine with all exercises)

---

#### `POST /routines/{log_id}/copy`
**Purpose:** Copy another user's public workout log as a routine  
**When to use:** "Save to my routines" button on public workout posts  
**Auth Required:** Yes

**Response:** `201 Created` (new routine object)

**Business Logic:**
- Only works on public workout logs
- Cannot copy your own workout logs
- Creates a new routine with exercises from the log
- Uses last set's weight as target weight

---

### 5. Seeded Workouts (`/workouts`)

Pre-built workouts created by admins for users to browse and use.

#### `GET /workouts/seeded`
**Purpose:** Get all seeded workouts  
**When to use:** Browse workouts screen  
**Auth Required:** No

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "Push", "Pull", "Legs")
- `difficulty` (optional): Filter by difficulty (e.g., "Beginner", "Intermediate", "Advanced")

**Example:** `GET /workouts/seeded?category=Push&difficulty=Intermediate`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Push Power",
    "description": "Chest, shoulders, triceps workout",
    "category": "Push",
    "difficulty": "Intermediate",
    "duration_minutes": 60,
    "is_preset": true,
    "created_by_admin": true,
    "created_at": "2026-04-01T10:00:00Z"
  }
]
```

---

#### `GET /workouts/seeded/{workout_id}`
**Purpose:** Get seeded workout details with exercises  
**When to use:** View workout details before starting  
**Auth Required:** No

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Push Power",
  "description": "Chest, shoulders, triceps workout",
  "category": "Push",
  "difficulty": "Intermediate",
  "duration_minutes": 60,
  "is_preset": true,
  "created_by_admin": true,
  "created_at": "2026-04-01T10:00:00Z",
  "exercises": [
    {
      "id": "uuid",
      "seeded_workout_id": "uuid",
      "exercise_library_id": "uuid",
      "order": 1,
      "target_sets": 4,
      "target_reps_min": 8,
      "target_reps_max": 12,
      "rest_seconds": 90,
      "notes": "Warm up first",
      "exercise_library": {
        "id": "uuid",
        "exercise_id": "0001",
        "name": "Barbell Bench Press",
        "body_part": "chest",
        "target": "pectorals",
        "equipment": "barbell",
        "gif_url": "https://example.com/bench.gif"
      }
    }
  ]
}
```

---

### 6. Workout Logs (`/workout-logs`)

Workout logs track actual workout sessions performed by users.

#### `POST /workout-logs/`
**Purpose:** Start a new workout session  
**When to use:** "Start Workout" button  
**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Push Day",
  "routine_id": "uuid-or-null",
  "is_public": false
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "routine_id": "uuid",
  "name": "Push Day",
  "started_at": "2026-04-19T14:00:00Z",
  "completed_at": null,
  "is_public": false,
  "media_url": null,
  "media_type": null,
  "caption": null,
  "duration": null,
  "exercises": []
}
```

---

#### `GET /workout-logs/me`
**Purpose:** Get all workout logs for current user  
**When to use:** Workout history screen  
**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "routine_id": "uuid",
    "name": "Push Day",
    "started_at": "2026-04-19T14:00:00Z",
    "completed_at": "2026-04-19T15:30:00Z",
    "is_public": true,
    "duration": 90
  }
]
```

---

#### `GET /workout-logs/{log_id}`
**Purpose:** Get specific workout log with all exercises and sets  
**When to use:** View workout details, resume workout  
**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "routine_id": "uuid",
  "name": "Push Day",
  "started_at": "2026-04-19T14:00:00Z",
  "completed_at": "2026-04-19T15:30:00Z",
  "is_public": true,
  "media_url": "https://example.com/workout.jpg",
  "media_type": "photo",
  "caption": "Great workout today!",
  "duration": 90,
  "exercises": [
    {
      "id": "uuid",
      "workout_log_id": "uuid",
      "exercise_id": "0001",
      "name": "Barbell Bench Press",
      "category": "chest",
      "target": "pectorals",
      "equipment": "barbell",
      "gif_url": "https://example.com/bench.gif",
      "order": 1,
      "sets": [
        {
          "id": "uuid",
          "workout_log_exercise_id": "uuid",
          "set_number": 1,
          "reps": 10,
          "weight_lbs": 135,
          "completed": true
        },
        {
          "id": "uuid",
          "workout_log_exercise_id": "uuid",
          "set_number": 2,
          "reps": 8,
          "weight_lbs": 155,
          "completed": true
        }
      ]
    }
  ]
}
```

---

#### `PUT /workout-logs/{log_id}`
**Purpose:** Update workout log (complete, add caption/media, change visibility)  
**When to use:** Complete workout, post to social feed  
**Auth Required:** Yes

**Request Body:** (All fields optional)
```json
{
  "name": "Updated name",
  "is_public": true,
  "completed_at": "2026-04-19T15:30:00Z",
  "duration": 90,
  "caption": "Great workout! New PR on bench",
  "media_url": "https://example.com/workout.jpg",
  "media_type": "photo"
}
```

**Response:** `200 OK` (full workout log object)

---

#### `DELETE /workout-logs/{log_id}`
**Purpose:** Delete a workout log  
**When to use:** Delete workout action  
**Auth Required:** Yes

**Response:** `204 No Content`

---

#### `POST /workout-logs/{log_id}/exercises`
**Purpose:** Add exercise to active workout  
**When to use:** During workout - add exercise  
**Auth Required:** Yes

**Request Body:**
```json
{
  "exercise_id": "0001",
  "name": "Barbell Bench Press",
  "category": "chest",
  "target": "pectorals",
  "equipment": "barbell",
  "gif_url": "https://example.com/bench.gif",
  "order": 1
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "workout_log_id": "uuid",
  "exercise_id": "0001",
  "name": "Barbell Bench Press",
  "category": "chest",
  "target": "pectorals",
  "equipment": "barbell",
  "gif_url": "https://example.com/bench.gif",
  "order": 1,
  "sets": []
}
```

---

#### `DELETE /workout-logs/{log_id}/exercises/{exercise_id}`
**Purpose:** Remove exercise from workout  
**When to use:** During workout - remove exercise  
**Auth Required:** Yes

**Response:** `204 No Content`

---

#### `POST /workout-logs/{log_id}/exercises/{exercise_id}/sets`
**Purpose:** Add a set to an exercise  
**When to use:** During workout - log each set  
**Auth Required:** Yes

**Request Body:**
```json
{
  "set_number": 1,
  "reps": 10,
  "weight_lbs": 135,
  "completed": true
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "workout_log_exercise_id": "uuid",
  "set_number": 1,
  "reps": 10,
  "weight_lbs": 135,
  "completed": true
}
```

---

#### `PUT /workout-logs/{log_id}/exercises/{exercise_id}/sets/{set_id}`
**Purpose:** Update a set (edit reps/weight)  
**When to use:** During workout - correct mistake  
**Auth Required:** Yes

**Request Body:**
```json
{
  "reps": 12,
  "weight_lbs": 145,
  "completed": true
}
```

**Response:** `200 OK` (updated set object)

---

#### `DELETE /workout-logs/{log_id}/exercises/{exercise_id}/sets/{set_id}`
**Purpose:** Delete a set  
**When to use:** During workout - remove incorrect set  
**Auth Required:** Yes

**Response:** `204 No Content`

---

#### `POST /workout-logs/{log_id}/start-from-routine`
**Purpose:** Populate workout log with exercises from a routine  
**When to use:** Start workout from saved routine  
**Auth Required:** Yes

**Request Body:**
```json
{
  "routine_id": "uuid"
}
```

**Response:** `200 OK` (workout log with exercises added)

**Business Logic:**
- Copies all exercises from routine to workout log
- Does NOT copy sets (user logs those during workout)
- Preserves exercise order and target values

---

## Common Workflows

### Workflow 1: New User Registration
```
1. POST /auth/register (email, password)
2. User confirms email via link
3. POST /auth/login (get token + is_onboarded=false)
4. POST /auth/onboarding (set username, profile)
5. GET /users/me (verify profile created)
```

---

### Workflow 2: Create and Use a Routine
```
1. GET /exercises/search?q=bench (find exercises)
2. POST /routines/ (create routine with exercises)
3. GET /routines/me (view all routines)
4. POST /workout-logs/ (start workout)
5. POST /workout-logs/{id}/start-from-routine (load routine exercises)
6. POST /workout-logs/{id}/exercises/{ex_id}/sets (log each set)
7. PUT /workout-logs/{id} (mark completed)
```

---

### Workflow 3: Quick Workout (No Routine)
```
1. POST /workout-logs/ (start workout)
2. GET /exercises/search?q=squat (find exercise)
3. POST /workout-logs/{id}/exercises (add exercise)
4. POST /workout-logs/{id}/exercises/{ex_id}/sets (log sets)
5. PUT /workout-logs/{id} (complete workout)
```

---

### Workflow 4: Post Workout to Social Feed
```
1. Complete workout (PUT /workout-logs/{id} with completed_at)
2. Upload photo/video to storage (external service)
3. PUT /workout-logs/{id} (add caption, media_url, is_public=true)
4. (Future) Workout appears in followers' feeds
```

---

### Workflow 5: Copy Someone's Workout
```
1. (Future) Browse social feed
2. View public workout log
3. POST /routines/{log_id}/copy (save as routine)
4. GET /routines/me (see new routine)
5. Use routine for future workouts
```

---

## Data Relationships

### User -> Profile (1:1)
- Every user has one profile
- Profile created automatically on registration
- Username set during onboarding

### User -> Routines (1:Many)
- Users can create multiple routines
- Routines can be public or private

### Routine -> Exercises (1:Many)
- Each routine contains multiple exercises
- Exercises stored with target sets/reps/weight

### User -> Workout Logs (1:Many)
- Users can have many workout sessions
- Each log can reference a routine (optional)

### Workout Log -> Exercises -> Sets (1:Many:Many)
- Each workout log has multiple exercises
- Each exercise has multiple sets
- Sets track actual performance (reps, weight)

### User -> Follows (Many:Many)
- Users can follow other users
- Cached counts in profile (followers_count, following_count)

---

## Not Yet Implemented (Social Features)

The following endpoints are planned but not yet implemented:

### Follow System
- `POST /users/{user_id}/follow`
- `DELETE /users/{user_id}/unfollow`
- `GET /users/{user_id}/followers`
- `GET /users/{user_id}/following`

### Social Feed
- `GET /feed` (workouts from followed users)
- `GET /users/{user_id}/posts` (user's public workouts)

### Likes
- `POST /workout-logs/{log_id}/like`
- `DELETE /workout-logs/{log_id}/unlike`
- `GET /workout-logs/{log_id}/likes`

### Comments
- `POST /workout-logs/{log_id}/comments`
- `GET /workout-logs/{log_id}/comments`
- `PUT /comments/{comment_id}`
- `DELETE /comments/{comment_id}`

### Notifications
- `GET /notifications`
- `PUT /notifications/{id}/read`

---

## Error Handling

All endpoints return standard HTTP status codes:

**Success Codes:**
- `200 OK` - Request successful
- `201 Created` - Resource created
- `204 No Content` - Successful deletion

**Client Error Codes:**
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `422 Unprocessable Entity` - Validation error

**Server Error Codes:**
- `500 Internal Server Error` - Server-side error

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong"
}
```

**Validation Error Format:**
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "Password must be at least 8 characters long",
      "type": "value_error"
    }
  ]
}
```

---

## Security Notes

1. **Authentication:** All protected endpoints require `Authorization: Bearer <token>` header
2. **Password Requirements:** Enforced on registration and password changes
3. **Username Uniqueness:** Checked during onboarding and profile updates
4. **Ownership Validation:** Users can only modify their own resources
5. **Public/Private:** Routines and workout logs have `is_public` flag for privacy control

---

## Best Practices for Frontend

1. **Store Token Securely:** Use secure storage (e.g., AsyncStorage with encryption)
2. **Handle Token Expiration:** Implement refresh logic or re-login flow
3. **Optimistic Updates:** Update UI immediately, rollback on error
4. **Pagination:** Implement infinite scroll for feeds (when available)
5. **Caching:** Cache user profile, routines, exercise library
6. **Offline Support:** Queue workout logs locally, sync when online
7. **Error Messages:** Display user-friendly error messages from API responses
8. **Loading States:** Show loading indicators during API calls

---

## Summary

This API provides a complete backend for a gym/fitness social app with:
- User authentication and profile management
- Exercise library with search and filters
- Routine creation and management
- Workout logging with sets/reps tracking
- Public/private workout sharing
- Seeded workouts for inspiration
- Social features (follow, feed, likes, comments) - coming soon

The app flow supports both planned workouts (via routines) and spontaneous workouts, with full tracking of exercises, sets, reps, and weights. Users can share their workouts publicly and copy others' workouts as routines.
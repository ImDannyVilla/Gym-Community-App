### Backend Technical Documentation: Gym Community App

This documentation provides an overview of the backend architecture for the Gym Community App, focusing on the newly implemented **Programs** module and its supporting core, models, routes, and schemas.

---

### 1. Core Architecture
The backend is built with **FastAPI** and uses **SQLAlchemy** (Asynchronous) for database interactions.

*   **Entry Point**: `app/main.py` initializes the FastAPI application, configures CORS, and includes the routers.
*   **Database**: `app/db.py` manages the connection to Supabase via `create_async_engine`. It provides a `get_db` dependency for route-level session management.
*   **Lifespan**: The application automatically creates database tables on startup using `Base.metadata.create_all`.

---

### 2. Database Models (`app/models`)
The database schema is designed to support hierarchical workout structures: **Programs → Workouts → Exercises**.

#### Program Models (`program.py`)
*   **`Program`**: Represents a high-level training plan (e.g., "3-Day PPL").
    *   Fields: `id`, `name`, `description`, `Difficulty`, `days_per_week`, `duration_weeks`, `is_preset`.
*   **`ProgramDay`**: A join table that schedules specific workouts into a program.
    *   Fields: `id`, `program_id` (FK), `workout_id` (FK), `day_of_week` (1-7), `week_number`.

#### Workout & Exercise Models (`workout.py`, `exercise.py`)
*   **`Workout`**: A collection of exercises (e.g., "Chest and Triceps").
    *   Includes `category` (Push/Pull/Legs) and `difficulty`.
*   **`Exercise`**: Specific movements within a workout, including data from the ExerciseDB API (`exercise_id`, `gif_url`) and user-defined targets (`sets`, `reps`, `rest_seconds`).

---

### 3. API Schemas (`app/schemas`)
Data validation and serialization are handled by **Pydantic v2**.

*   **`ProgramSummary`**: Used for listing programs (id, name, difficulty).
*   **`ProgramResponse`**: Includes the full `schedule`, which nests `ProgramDay` objects containing simplified workout details.
*   **`WorkoutInSchedule`**: A lightweight version of the workout schema used specifically inside program views to avoid deep recursion.

---

### 4. API Routes (`app/routes`)
The routes follow a RESTful pattern and are prefixed accordingly.

#### Programs (`/programs`)
*   **`GET /`**: Retrieves all "preset" programs marked by admins. Sorted by difficulty and frequency.
*   **`GET /{id}`** *(In Progress)*: Designed to return the full program schedule and details.

#### Workouts (`/workouts`)
*   **`GET /`**: List all preset workouts. Supports filtering by `category` (e.g., `?category=Push`).
*   **`GET /{id}`**: Fetches a specific workout along with its full list of exercises.

---

### 5. Data Seeding & Scripts (`scripts/`)
To populate the application with "TEMPLATE PROGRAMS", a seeding strategy is used:

*   **`seed_workouts.py`**: A script that creates standard workouts (Chest/Triceps, Back/Biceps, Legs) and attaches exercises to them.
*   **Upcoming Script**: A new script (e.g., `seed_programs.py`) will be implemented to link these existing workouts into full `Program` structures.

---
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
<<<<<<< HEAD
from pydantic import BaseModel
from .db import engine, Base, async_session_maker
from app.routes import auth, workout, users, programs
from sqlalchemy import select
from app.models.workout import Workout
from app.models.exercise import Exercise
=======
from app.routes import auth, workout, users, exercise, workout_log, routine
>>>>>>> 1a8403eae355262c2b0231f76289f6fc81dc8abd
from typing import List
from contextlib import asynccontextmanager

async def seed_workouts_on_startup():
    """Auto-seed workouts if none exist."""
    async with async_session_maker() as db:
        result = await db.execute(
            select(Workout).where(Workout.is_preset == True)
        )
        existing = result.scalars().all()
        if existing:
            print(f"✅ {len(existing)} preset workouts already exist, skipping seed.")
            return
    
    print("🌱 Auto-seeding preset workouts...")
    
    # Seed Chest and Triceps
    async with async_session_maker() as db:
        workout = Workout(
            name="Chest and Triceps",
            description="Build upper body pushing strength with compound and isolation movements",
            category="Push",
            difficulty="Intermediate",
            duration_minutes=60,
            is_preset=True,
            created_by_admin=True
        )
        db.add(workout)
        await db.commit()
        await db.refresh(workout)
        
        exercises = [
            Exercise(
                workout_id=workout.id,
                name="Barbell Bench Press",
                sets=4,
                reps=10,
                rest_period_seconds=90,
                order=1,
                notes="Focus on controlled descent"
            ),
            Exercise(
                workout_id=workout.id,
                name="Incline Dumbbell Press",
                sets=3,
                reps=10,
                rest_period_seconds=60,
                order=2,
                notes="Full range of motion"
            ),
            Exercise(
                workout_id=workout.id,
                name="Cable Chest Fly",
                sets=3,
                reps=12,
                rest_period_seconds=45,
                order=3,
                notes="Squeeze at peak"
            ),
            Exercise(
                workout_id=workout.id,
                name="Tricep Dips",
                sets=3,
                reps=10,
                rest_period_seconds=60,
                order=4,
                notes="Lean forward slightly"
            ),
            Exercise(
                workout_id=workout.id,
                name="Overhead Tricep Extension",
                sets=3,
                reps=12,
                rest_period_seconds=45,
                order=5,
                notes="Keep elbows close"
            ),
        ]
        for ex in exercises:
            db.add(ex)
        await db.commit()
        print("✅ Seeded: Chest and Triceps")
    
    # Seed Back and Biceps
    async with async_session_maker() as db:
        workout = Workout(
            name="Back and Biceps",
            description="Build a strong, wide back and defined biceps",
            category="Pull",
            difficulty="Intermediate",
            duration_minutes=60,
            is_preset=True,
            created_by_admin=True
        )
        db.add(workout)
        await db.commit()
        await db.refresh(workout)
        
        exercises = [
            Exercise(
                workout_id=workout.id,
                name="Barbell Deadlift",
                sets=4,
                reps=8,
                rest_period_seconds=120,
                order=1,
                notes="Maintain neutral spine"
            ),
            Exercise(
                workout_id=workout.id,
                name="Pull-ups",
                sets=4,
                reps=10,
                rest_period_seconds=90,
                order=2,
                notes="Full extension"
            ),
            Exercise(
                workout_id=workout.id,
                name="Barbell Row",
                sets=3,
                reps=10,
                rest_period_seconds=60,
                order=3,
                notes="Pull to lower chest"
            ),
            Exercise(
                workout_id=workout.id,
                name="Barbell Curl",
                sets=3,
                reps=10,
                rest_period_seconds=45,
                order=4,
                notes="Control the negative"
            ),
            Exercise(
                workout_id=workout.id,
                name="Hammer Curls",
                sets=3,
                reps=12,
                rest_period_seconds=45,
                order=5,
                notes="Targets brachialis"
            ),
        ]
        for ex in exercises:
            db.add(ex)
        await db.commit()
        print("✅ Seeded: Back and Biceps")
    
    # Seed Leg Day
    async with async_session_maker() as db:
        workout = Workout(
            name="Leg Day",
            description="Build powerful legs with compound and isolation movements",
            category="Legs",
            difficulty="Intermediate",
            duration_minutes=70,
            is_preset=True,
            created_by_admin=True
        )
        db.add(workout)
        await db.commit()
        await db.refresh(workout)
        
        exercises = [
            Exercise(
                workout_id=workout.id,
                name="Barbell Squat",
                sets=4,
                reps=8,
                rest_period_seconds=120,
                order=1,
                notes="Depth to parallel"
            ),
            Exercise(
                workout_id=workout.id,
                name="Romanian Deadlift",
                sets=3,
                reps=10,
                rest_period_seconds=90,
                order=2,
                notes="Feel the stretch"
            ),
            Exercise(
                workout_id=workout.id,
                name="Leg Press",
                sets=3,
                reps=12,
                rest_period_seconds=60,
                order=3,
                notes="Full range of motion"
            ),
            Exercise(
                workout_id=workout.id,
                name="Leg Curl",
                sets=3,
                reps=15,
                rest_period_seconds=45,
                order=4,
                notes="Squeeze at peak"
            ),
            Exercise(
                workout_id=workout.id,
                name="Calf Raises",
                sets=4,
                reps=15,
                rest_period_seconds=45,
                order=5,
                notes="Full stretch at bottom"
            ),
        ]
        for ex in exercises:
            db.add(ex)
        await db.commit()
        print("✅ Seeded: Leg Day")
    
    print("✅ All workouts seeded!")

@asynccontextmanager
async def lifespan(app: FastAPI):
<<<<<<< HEAD
    # This runs when the server starts
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Auto-seed workouts on startup
    try:
        await seed_workouts_on_startup()
    except Exception as e:
        print(f"Auto-seed skipped: {e}")
    
    yield

=======
    # Tables are managed by Alembic migrations, not create_all
    yield
>>>>>>> 1a8403eae355262c2b0231f76289f6fc81dc8abd
gym_app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:8081",
    "http://localhost:19006",
    "exp://192.168.*.*:8081",
    "exp://192.168.*.*:8082",
]

gym_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gym_app.include_router(auth.router)
gym_app.include_router(workout.router)
#gym_app.include_router(programs.router)
gym_app.include_router(users.router)
gym_app.include_router(exercise.router)
gym_app.include_router(workout_log.router)
gym_app.include_router(routine.router)
@gym_app.get("/health")
def health_check():
    return {"status": "healthy"}

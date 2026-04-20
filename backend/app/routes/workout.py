from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.models.seededWorkout import SeededWorkout
from app.models.seeded_workout_exercise import SeededWorkoutExercise
from app.schemas.workout import SeededWorkoutSummary, SeededWorkoutResponse
from app.dependencies import AsyncSessionDep

router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.get("/seeded", response_model=List[SeededWorkoutSummary])
async def get_seeded_workouts(
    db: AsyncSessionDep,
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
):
    """Get all seeded workouts. Optional filters: ?category=Push&difficulty=Intermediate"""
    query = select(SeededWorkout).where(SeededWorkout.is_preset == True)

    if category:
        query = query.where(SeededWorkout.category == category)
    if difficulty:
        query = query.where(SeededWorkout.difficulty == difficulty)

    query = query.order_by(SeededWorkout.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/seeded/{workout_id}", response_model=SeededWorkoutResponse)
async def get_seeded_workout(workout_id: UUID, db: AsyncSessionDep):
    result = await db.execute(
        select(SeededWorkout)
        .options(
            selectinload(SeededWorkout.exercises)
            .selectinload(SeededWorkoutExercise.exercise_library)
        )
        .where(SeededWorkout.id == workout_id)
    )
    workout = result.scalars().first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    return workout
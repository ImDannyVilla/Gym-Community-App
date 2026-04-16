from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.db import get_db
from app.models.workout import Workout
from app.models.exercise import Exercise
from app.schemas.workout import WorkoutResponse, WorkoutSummary
from app.dependencies import AsyncSessionDep

router = APIRouter(prefix="/workouts", tags=["Workouts"])


@router.get("/category/{category}", response_model=List[WorkoutSummary])
async def get_workouts_by_category(
        category: str,
        db: AsyncSession = Depends(get_db)
):

#Get workouts by category.
    result = await db.execute(
        select(Workout)
        .where(Workout.category == category)
        .where(Workout.is_preset == True)
        .order_by(Workout.created_at.desc())
    )
    workouts = result.scalars().all()

    return workouts


@router.get("/", response_model=List[WorkoutSummary])
async def get_all_workouts(
        db: AsyncSessionDep,
        category: str | None = None
):

#   Get all preset workouts.
#   Optional filter: ?category=Push
    query = select(Workout).where(Workout.is_preset == True)

    if category:
        query = query.where(Workout.category == category)

    result = await db.execute(query.order_by(Workout.created_at.desc()))
    workouts = result.scalars().all()

    return workouts


@router.get("/{workout_id}", response_model=WorkoutResponse)
async def get_workout_detail(
        workout_id: int,
        db: AsyncSession = Depends(get_db)
):
#    Get specific workout with all exercises.
    result = await db.execute(
        select(Workout)
        .options(selectinload(Workout.exercises))
        .where(Workout.id == workout_id)

    )
    workout = result.scalars().first()

    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

    return workout


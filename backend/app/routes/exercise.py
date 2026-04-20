from fastapi import APIRouter, Query, HTTPException
from sqlalchemy import select, or_
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import selectinload

from app.models.exerciseLibrary import ExerciseLibrary
from app.dependencies import AsyncSessionDep, CurrentUser
from app.models.workout_log import WorkoutLogExercise, WorkoutLog
from app.schemas.exercise import ExerciseLibraryResponse, ExerciseHistoryResponse

router = APIRouter(prefix="/exercises", tags=["Exercises"])


@router.get("/search", response_model=List[ExerciseLibraryResponse])
async def search_exercises(
    db: AsyncSessionDep,
    q: Optional[str] = Query(None, description="Search by name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    equipment: Optional[str] = Query(None, description="Filter by equipment"),
    target: Optional[str] = Query(None, description="Filter by target muscle"),
    limit: int = Query(20, le=50),
):
    """
    Fuzzy search exercises from the library.
    Examples:
    - /exercises/search?q=bench
    - /exercises/search?body_part=chest
    - /exercises/search?q=curl&equipment=dumbbell
    """
    query = select(ExerciseLibrary)

    if q:
        query = query.where(ExerciseLibrary.name.ilike(f"%{q}%"))
    if category:
        query = query.where(ExerciseLibrary.category.ilike(f"%{category}%"))
    if equipment:
        query = query.where(ExerciseLibrary.equipment.ilike(f"%{equipment}%"))
    if target:
        query = query.where(ExerciseLibrary.target.ilike(f"%{target}%"))

    query = query.order_by(ExerciseLibrary.name).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/body-parts", response_model=List[str])
async def get_body_parts(db: AsyncSessionDep):
    """Get all unique body parts for filter UI."""
    from sqlalchemy import distinct
    result = await db.execute(
        select(distinct(ExerciseLibrary.target))
        .where(ExerciseLibrary.target.isnot(None))
        .order_by(ExerciseLibrary.target)
    )
    return [row for row in result.scalars().all()]


@router.get("/equipment", response_model=List[str])
async def get_equipment_types(db: AsyncSessionDep):
    """Get all unique equipment types for filter UI."""
    from sqlalchemy import distinct
    result = await db.execute(
        select(distinct(ExerciseLibrary.equipment))
        .where(ExerciseLibrary.equipment.isnot(None))
        .order_by(ExerciseLibrary.equipment)
    )
    return [row for row in result.scalars().all()]

@router.get("/{exercise_id}/history", response_model=ExerciseHistoryResponse)
async def get_exercise_history(
    exercise_id: str,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """
    Get the last performance for a specific exercise.
    Returns sets/reps/weight from the most recent session.
    """
    result = await db.execute(
        select(WorkoutLogExercise)
        .join(WorkoutLog, WorkoutLog.id == WorkoutLogExercise.workout_log_id)
        .options(
            selectinload(WorkoutLogExercise.sets),
            selectinload(WorkoutLogExercise.workout_logs)  # load parent log
        )
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLogExercise.exercise_id == exercise_id)
        .order_by(WorkoutLog.started_at.desc())
        .limit(1)
    )
    last = result.scalars().first()

    if not last:
        raise HTTPException(status_code=404, detail="No previous performance found for this exercise")

    return ExerciseHistoryResponse(
        exercise_id=last.exercise_id,
        name=last.name,
        last_performed=last.workout_logs.started_at,
        sets=last.sets
    )
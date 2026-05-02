from fastapi import APIRouter, Query, HTTPException
from sqlalchemy import select
from typing import Optional, List
from uuid import UUID

from sqlalchemy.orm import selectinload

from app.models.exerciseLibrary import ExerciseLibrary
from app.dependencies import AsyncSessionDep, CurrentUser
from app.models.workout_log import WorkoutLogExercise, WorkoutLog, WorkoutLogSet
from app.schemas.exercise import ExerciseLibraryResponse, ExerciseHistoryResponse, ExerciseRecordsResponse

router = APIRouter(prefix="/exercises", tags=["Exercises"])


def sanitize_search_term(term: str) -> str:
    """Remove wildcard characters to prevent SQL injection in LIKE queries."""
    return term.replace("%", "").replace("_", "")


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
        safe_q = sanitize_search_term(q)
        query = query.where(ExerciseLibrary.name.ilike(f"%{safe_q}%"))
    if category:
        safe_category = sanitize_search_term(category)
        query = query.where(ExerciseLibrary.category.ilike(f"%{safe_category}%"))
    if equipment:
        safe_equipment = sanitize_search_term(equipment)
        query = query.where(ExerciseLibrary.equipment.ilike(f"%{safe_equipment}%"))
    if target:
        safe_target = sanitize_search_term(target)
        query = query.where(ExerciseLibrary.target.ilike(f"%{safe_target}%"))

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

@router.get("/{exercise_id}/records", response_model=ExerciseRecordsResponse)
async def get_exercise_records(
    exercise_id: str,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Get personal records (best weight, reps, volume) for an exercise across all completed sets."""
    from sqlalchemy import func as sqlfunc
    result = await db.execute(
        select(
            sqlfunc.max(WorkoutLogSet.weight_lbs).label("best_weight_lbs"),
            sqlfunc.max(WorkoutLogSet.reps).label("best_reps"),
            sqlfunc.max(WorkoutLogSet.weight_lbs * WorkoutLogSet.reps).label("best_volume"),
            sqlfunc.count(WorkoutLogSet.id).label("total_sets_logged"),
            sqlfunc.max(WorkoutLog.completed_at).label("last_performed"),
        )
        .join(WorkoutLogExercise, WorkoutLogSet.workout_log_exercise_id == WorkoutLogExercise.id)
        .join(WorkoutLog, WorkoutLogExercise.workout_log_id == WorkoutLog.id)
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLogExercise.exercise_id == exercise_id)
        .where(WorkoutLogSet.completed == True)
    )
    row = result.first()

    if row is None or (row.total_sets_logged or 0) == 0:
        raise HTTPException(status_code=404, detail="No records found for this exercise")

    return ExerciseRecordsResponse(
        best_weight_lbs=float(row.best_weight_lbs or 0),
        best_reps=int(row.best_reps or 0),
        best_volume=float(row.best_volume or 0),
        total_sets_logged=int(row.total_sets_logged or 0),
        last_performed=row.last_performed,
    )


@router.get("/{exercise_id}/history", response_model=List[ExerciseHistoryResponse])
async def get_exercise_history(
    exercise_id: str,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """
    Get all logged sessions for a specific exercise, newest first.
    Each entry has the date performed and the sets/reps/weight logged.
    """
    result = await db.execute(
        select(WorkoutLogExercise)
        .join(WorkoutLog, WorkoutLog.id == WorkoutLogExercise.workout_log_id)
        .options(
            selectinload(WorkoutLogExercise.sets),
            selectinload(WorkoutLogExercise.workout_logs)
        )
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLogExercise.exercise_id == exercise_id)
        .order_by(WorkoutLog.started_at.desc())
    )
    entries = result.scalars().all()

    if not entries:
        raise HTTPException(status_code=404, detail="No previous performance found for this exercise")

    return [
        ExerciseHistoryResponse(
            exercise_id=entry.exercise_id,
            name=entry.name,
            last_performed=entry.workout_logs.started_at,
            sets=entry.sets,
        )
        for entry in entries
    ]
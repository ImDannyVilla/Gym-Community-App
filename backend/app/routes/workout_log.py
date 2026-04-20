from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone

from app.models.routine import Routine, RoutineExercise
from app.models.workout_log import WorkoutLog, WorkoutLogExercise, WorkoutLogSet
from app.schemas.routine import RoutineResponse
from app.schemas.workout_log import (
    WorkoutLogCreate, WorkoutLogUpdate,
    WorkoutLogSummary, WorkoutLogResponse,
    WorkoutLogExerciseCreate
)
from app.dependencies import AsyncSessionDep, CurrentUser

router = APIRouter(prefix="/workout-logs", tags=["Workout Logs"])

@router.post("/", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
async def start_workout(
    data: WorkoutLogCreate,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    log = WorkoutLog(
        id=uuid4(),
        user_id=current_user.id,
        name=data.name,
        routine_id=data.routine_id,
        is_public=data.is_public,
    )
    db.add(log)
    await db.commit()

    # reload with exercises eagerly loaded
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log.id)
    )
    return result.scalars().first()


@router.get("/me", response_model=List[WorkoutLogSummary])
async def get_my_workout_logs(
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Get all workout logs for the current user."""
    result = await db.execute(
        select(WorkoutLog)
        .where(WorkoutLog.user_id == current_user.id)
        .order_by(WorkoutLog.started_at.desc())
    )
    return result.scalars().all()


@router.get("/{log_id}", response_model=WorkoutLogResponse)
async def get_workout_log(
    log_id: UUID,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Get a specific workout log with all exercises and sets."""
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.user_id == current_user.id)
    )
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Workout log not found")
    return log

@router.put("/{log_id}", response_model=WorkoutLogResponse)
async def update_workout_log(
    log_id: UUID,
    data: WorkoutLogUpdate,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.user_id == current_user.id)
    )
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Workout log not found")

    if data.name is not None:
        log.name = data.name
    if data.is_public is not None:
        log.is_public = data.is_public
    if data.completed_at is not None:
        log.completed_at = data.completed_at
    if data.duration is not None:
        log.duration = data.duration
    if data.caption is not None:
        log.caption = data.caption
    if data.media_url is not None:
        log.media_url = data.media_url
    if data.media_type is not None:
        log.media_type = data.media_type

    await db.commit()

    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
    )
    return result.scalars().first()


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout_log(
    log_id: UUID,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Delete a workout log."""
    result = await db.execute(
        select(WorkoutLog)
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.user_id == current_user.id)
    )
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Workout log not found")
    await db.delete(log)
    await db.commit()


@router.post("/{log_id}/exercises", response_model=WorkoutLogResponse, status_code=status.HTTP_201_CREATED)
async def add_exercise_to_log(
    log_id: UUID,
    data: WorkoutLogExerciseCreate,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Add an exercise with sets to a workout log."""
    result = await db.execute(
        select(WorkoutLog)
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.user_id == current_user.id)
    )
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Workout log not found")

    exercise = WorkoutLogExercise(
        id=uuid4(),
        workout_log_id=log_id,
        exercise_id=data.exercise_id,
        name=data.name,
        category=data.category,
        target=data.target,
        equipment=data.equipment,
        gif_url=data.gif_url,
        order=data.order,
    )
    db.add(exercise)
    await db.flush()

    for set_data in data.sets:
        workout_set = WorkoutLogSet(
            id=uuid4(),
            workout_log_exercise_id=exercise.id,
            set_number=set_data.set_number,
            reps=set_data.reps,
            weight_lbs=set_data.weight_lbs,
            completed=set_data.completed,
        )
        db.add(workout_set)

    await db.commit()

    # return full log with exercises
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
    )
    return result.scalars().first()

@router.post("/{log_id}/save-as-routine", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def save_log_as_routine(
    log_id: UUID,
    db: AsyncSessionDep,
    current_user: CurrentUser,
    name: Optional[str] = None,  # optional custom name, defaults to log name
):
    """
    Save a completed workout log as a reusable routine.
    User can call this at the end of a session to save it as a template.
    """
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.user_id == current_user.id)
    )
    log = result.scalars().first()

    if not log:
        raise HTTPException(status_code=404, detail="Workout log not found")

    routine_name = name or log.name

    new_routine = Routine(
        id=uuid4(),
        user_id=current_user.id,
        name=routine_name,
        description=f"Saved from workout on {log.started_at.strftime('%b %d, %Y')}",
        is_public=False,
    )
    db.add(new_routine)
    await db.flush()

    for ex in log.exercises:
        last_set = ex.sets[-1] if ex.sets else None
        routine_ex = RoutineExercise(
            id=uuid4(),
            routine_id=new_routine.id,
            exercise_id=ex.exercise_id,
            name=ex.name,
            gif_url=ex.gif_url,
            category=ex.category,
            target=ex.target,
            equipment=ex.equipment,
            order=ex.order,
            target_sets=len(ex.sets) if ex.sets else 3,
            target_reps_min=last_set.reps if last_set else None,
            target_reps_max=last_set.reps if last_set else None,
            target_weight_lbs=int(last_set.weight_lbs) if last_set else None,
            notes=None,
        )
        db.add(routine_ex)

    await db.commit()

    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == new_routine.id)
    )
    return result.scalars().first()
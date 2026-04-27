from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta

from app.models.routine import Routine, RoutineExercise
from app.models.workout_log import WorkoutLog, WorkoutLogExercise, WorkoutLogSet
from app.models.user import UserProfile
from app.schemas.routine import RoutineResponse
from app.schemas.workout_log import (
    WorkoutLogCreate, WorkoutLogUpdate,
    WorkoutLogSummary, WorkoutLogResponse,
    WorkoutLogExerciseCreate
)
from app.dependencies import AsyncSessionDep, CurrentUser

router = APIRouter(prefix="/workout-logs", tags=["Workout Logs"])


async def update_user_streak(db: AsyncSessionDep, user_id: UUID):
    """
    Calculate and update user's workout streak based on completed workout logs.
    Counts consecutive calendar days with at least one completed workout.
    """
    # get all completed workouts for this user, ordered by completion date
    result = await db.execute(
        select(WorkoutLog)
        .where(WorkoutLog.user_id == user_id)
        .where(WorkoutLog.completed_at.isnot(None))
        .order_by(WorkoutLog.completed_at.desc())
    )
    completed_logs = result.scalars().all()
    
    if not completed_logs:
        # No completed workouts, reset streak
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()
        if profile:
            profile.day_streak = 0
            profile.total_workouts = 0
            await db.commit()
        return
    
    # Update total workouts
    total_workouts = len(completed_logs)
    
    # extracting unique workout dates (calendar days, so ignoring time)
    workout_dates = set()
    for log in completed_logs:
        #converting dates (ignoring time component)
        workout_date = log.completed_at.date()
        workout_dates.add(workout_date)
    
    sorted_dates = sorted(workout_dates, reverse=True)
    
    # Calculate current streak
    current_streak = 0
    today = datetime.now(timezone.utc).date()
    
    # check if most recent workout was today or yesterday
    if sorted_dates[0] == today or sorted_dates[0] == today - timedelta(days=1):
        current_streak = 1
        expected_date = sorted_dates[0] - timedelta(days=1)
        
        # counting consecutive days backwards
        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] == expected_date:
                current_streak += 1
                expected_date -= timedelta(days=1)
            elif sorted_dates[i] < expected_date:
                # Gap found, streak broken
                break
    # else: streak is 0 last workout was more than a day ago
    
    #uUpdate user profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalars().first()
    
    if profile:
        profile.day_streak = current_streak
        profile.total_workouts = total_workouts
        await db.commit()

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

@router.get("/me/streak")
async def get_my_workout_streak(
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Get workout streak stats including workouts this week."""
    # Calculate workouts this week
    today = datetime.now(timezone.utc)
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    
    result = await db.execute(
        select(func.count(WorkoutLog.id))
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLog.completed_at >= start_of_week)
    )
    workouts_this_week = result.scalar() or 0
    
    # Also fetch day streak from profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = profile_result.scalars().first()
    day_streak = profile.day_streak if profile else 0
    
    return {
        "workouts_this_week": workouts_this_week,
        "day_streak": day_streak
    }


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
        await update_user_streak(db, current_user.id)
        
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
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func, cast, Date
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime, timezone, timedelta

from app.models.routine import Routine, RoutineExercise
from app.models.workout_log import WorkoutLog, WorkoutLogExercise, WorkoutLogSet
from app.models.exerciseLibrary import ExerciseLibrary
from app.models.user import UserProfile
from app.schemas.routine import RoutineResponse
from app.schemas.workout_log import (
    WorkoutLogCreate, WorkoutLogUpdate,
    WorkoutLogResponse,
    WorkoutLogExerciseCreate,
    WorkoutLogFinalize,
    PublicFeedPost,
    PublicWorkoutLogResponse,
)
from app.dependencies import AsyncSessionDep, CurrentUser

router = APIRouter(prefix="/workout-logs", tags=["Workout Logs"])


async def enrich_exercises_with_library_gifs(db: AsyncSessionDep, exercises) -> None:
    """Overwrite gif_url on in-memory WorkoutLogExercise objects with the current ExerciseLibrary value."""
    exercise_ids = [ex.exercise_id for ex in exercises if ex.exercise_id]
    if not exercise_ids:
        return
    result = await db.execute(
        select(ExerciseLibrary.exercise_id, ExerciseLibrary.gif_url)
        .where(ExerciseLibrary.exercise_id.in_(exercise_ids))
    )
    gif_map = {row.exercise_id: row.gif_url for row in result}
    for ex in exercises:
        if ex.exercise_id in gif_map and gif_map[ex.exercise_id]:
            ex.gif_url = gif_map[ex.exercise_id]


async def update_user_streak(db: AsyncSessionDep, user_id: UUID):
    """
    Calculate and update user's workout streak based on completed workout logs.
    Counts consecutive calendar days with at least one completed workout.
    """
    # 1. Get total completed workouts
    total_result = await db.execute(
        select(func.count(WorkoutLog.id))
        .where(WorkoutLog.user_id == user_id)
        .where(WorkoutLog.completed_at.isnot(None))
    )
    total_workouts = total_result.scalar() or 0
    
    if total_workouts == 0:
        # No completed workouts, reset streak
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()
        if profile:
            profile.day_streak = 0
            profile.total_workouts = 0
        return

    # 2. Get unique workout dates, ordered descending
    dates_result = await db.execute(
        select(cast(WorkoutLog.completed_at, Date))
        .where(WorkoutLog.user_id == user_id)
        .where(WorkoutLog.completed_at.isnot(None))
        .distinct()
        .order_by(cast(WorkoutLog.completed_at, Date).desc())
    )
    
    # Extract dates from result tuples
    sorted_dates = [row[0] for row in dates_result.all()]
    
    # Calculate current streak
    current_streak = 0
    today = datetime.now(timezone.utc).date()
    
    # check if most recent workout was today or yesterday
    if sorted_dates and (sorted_dates[0] == today or sorted_dates[0] == today - timedelta(days=1)):
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
    
    # Update user profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = profile_result.scalars().first()
    
    if profile:
        profile.day_streak = current_streak
        profile.total_workouts = total_workouts


async def load_workout_log_response(db: AsyncSessionDep, log_id: UUID, user_id: UUID):
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.user_id == user_id)
    )
    return result.scalars().first()

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


@router.get("/me", response_model=List[WorkoutLogResponse])
async def get_my_workout_logs(
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Get completed workout logs for the current user."""
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLog.completed_at.isnot(None))
        .order_by(WorkoutLog.completed_at.desc())
    )
    return result.scalars().all()

@router.get("/me/streak")
async def get_my_workout_streak(
    db: AsyncSessionDep,
    current_user: CurrentUser,
    tz_offset_minutes: int = 0,
):
    """Get workout streak stats including workouts this week, total workouts, and sets.

    `tz_offset_minutes` is the client's offset from UTC (matches `-Date.getTimezoneOffset()`
    in JS — e.g. PDT sends -420). Streak buckets are computed in the client's local TZ so
    an evening workout doesn't roll into "tomorrow UTC" and silently break the streak.
    """
    # Calculate workouts this week
    today = datetime.now(timezone.utc)
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    # Workouts this week
    result = await db.execute(
        select(func.count(WorkoutLog.id))
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLog.completed_at >= start_of_week)
    )
    workouts_this_week = result.scalar() or 0

    # Total workouts
    total_result = await db.execute(
        select(func.count(WorkoutLog.id))
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLog.completed_at.isnot(None))
    )
    total_workouts = total_result.scalar() or 0

    # Total sets done
    sets_result = await db.execute(
        select(func.count(WorkoutLogSet.id))
        .join(WorkoutLogExercise, WorkoutLogExercise.id == WorkoutLogSet.workout_log_exercise_id)
        .join(WorkoutLog, WorkoutLog.id == WorkoutLogExercise.workout_log_id)
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLogSet.completed == True)
    )
    total_sets = sets_result.scalar() or 0

    # Total volume lifted (weight_lbs * reps summed across all completed sets)
    volume_result = await db.execute(
        select(func.sum(WorkoutLogSet.weight_lbs * WorkoutLogSet.reps))
        .join(WorkoutLogExercise, WorkoutLogExercise.id == WorkoutLogSet.workout_log_exercise_id)
        .join(WorkoutLog, WorkoutLog.id == WorkoutLogExercise.workout_log_id)
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLogSet.completed == True)
    )
    total_volume = float(volume_result.scalar() or 0)

    # Recompute day streak in the client's local TZ (the persisted profile.day_streak
    # is computed in UTC at save time and can't reflect the user's actual day boundary).
    timestamps_result = await db.execute(
        select(WorkoutLog.completed_at)
        .where(WorkoutLog.user_id == current_user.id)
        .where(WorkoutLog.completed_at.isnot(None))
    )
    local_dates = sorted({
        ((ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc))
         + timedelta(minutes=tz_offset_minutes)).date()
        for (ts,) in timestamps_result.all()
    }, reverse=True)

    today_local = (datetime.now(timezone.utc) + timedelta(minutes=tz_offset_minutes)).date()
    day_streak = 0
    if local_dates and local_dates[0] in (today_local, today_local - timedelta(days=1)):
        day_streak = 1
        expected = local_dates[0] - timedelta(days=1)
        for d in local_dates[1:]:
            if d == expected:
                day_streak += 1
                expected -= timedelta(days=1)
            elif d < expected:
                break

    return {
        "workouts_this_week": workouts_this_week,
        "day_streak": day_streak,
        "total_workouts": total_workouts,
        "total_sets": total_sets,
        "total_volume": total_volume,
    }


@router.get("/public", response_model=List[PublicFeedPost])
async def get_public_feed(
    db: AsyncSessionDep,
    skip: int = 0,
    limit: int = 20,
    user_id: Optional[UUID] = None,
):
    """Get public workout posts ordered by most recent. No auth required."""
    exercise_count_sq = (
        select(func.count(WorkoutLogExercise.id))
        .where(WorkoutLogExercise.workout_log_id == WorkoutLog.id)
        .correlate(WorkoutLog)
        .scalar_subquery()
    )

    query = (
        select(
            WorkoutLog,
            UserProfile.user_name,
            UserProfile.full_name,
            UserProfile.avatar_url,
            exercise_count_sq.label("exercise_count"),
        )
        .join(UserProfile, UserProfile.user_id == WorkoutLog.user_id, isouter=True)
        .where(WorkoutLog.is_public == True)
        .where(WorkoutLog.completed_at.isnot(None))
        .order_by(WorkoutLog.completed_at.desc())
        .offset(skip)
        .limit(min(limit, 50))
    )

    if user_id is not None:
        query = query.where(WorkoutLog.user_id == user_id)

    result = await db.execute(query)
    rows = result.all()

    return [
        PublicFeedPost(
            id=row.WorkoutLog.id,
            name=row.WorkoutLog.name,
            completed_at=row.WorkoutLog.completed_at,
            duration=row.WorkoutLog.duration,
            media_url=row.WorkoutLog.media_url,
            media_type=row.WorkoutLog.media_type,
            caption=row.WorkoutLog.caption,
            user_id=row.WorkoutLog.user_id,
            user_name=row.user_name,
            full_name=row.full_name,
            avatar_url=row.avatar_url,
            exercise_count=row.exercise_count or 0,
        )
        for row in rows
    ]


@router.get("/public/{log_id}", response_model=PublicWorkoutLogResponse)
async def get_public_workout_log(
    log_id: UUID,
    db: AsyncSessionDep,
):
    """Get a public workout log with full exercises and sets. No auth required. Returns 404 if private."""
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.is_public == True)
    )
    log = result.scalars().first()
    if not log:
        raise HTTPException(status_code=404, detail="Workout log not found")

    await enrich_exercises_with_library_gifs(db, log.exercises)

    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == log.user_id)
    )
    profile = profile_result.scalars().first()

    return PublicWorkoutLogResponse(
        id=log.id,
        name=log.name,
        completed_at=log.completed_at,
        duration=log.duration,
        media_url=log.media_url,
        media_type=log.media_type,
        caption=log.caption,
        user_id=log.user_id,
        user_name=profile.user_name if profile else None,
        full_name=profile.full_name if profile else None,
        avatar_url=profile.avatar_url if profile else None,
        exercises=log.exercises,
    )


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
    await enrich_exercises_with_library_gifs(db, log.exercises)
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
        await db.flush()
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

    return await load_workout_log_response(db, log_id, current_user.id)


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
        target_sets=data.target_sets,
        target_reps_min=data.target_reps_min,
        target_reps_max=data.target_reps_max,
        target_weight_lbs=data.target_weight_lbs,
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

    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
    )
    return result.scalars().first()

@router.post("/{log_id}/finalize", response_model=WorkoutLogResponse)
async def finalize_workout_log(
    log_id: UUID,
    data: WorkoutLogFinalize,
    db: AsyncSessionDep,
    current_user: CurrentUser,
):
    """
    Atomically write the full completed workout in one transaction.
    Replaces any existing exercises on the log (delete-then-insert) so retries
    are idempotent. Recomputes the user streak in the same commit.
    """
    result = await db.execute(
        select(WorkoutLog)
        .options(selectinload(WorkoutLog.exercises))
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

    # Derive started_at from completed_at - duration when both are provided so
    # backfilled workouts don't end up with completed_at < started_at.
    if data.completed_at is not None and data.duration is not None:
        log.started_at = data.completed_at - timedelta(seconds=data.duration)

    for existing in list(log.exercises):
        await db.delete(existing)
    await db.flush()

    for ex_data in data.exercises:
        exercise = WorkoutLogExercise(
            id=uuid4(),
            workout_log_id=log_id,
            exercise_id=ex_data.exercise_id,
            name=ex_data.name,
            category=ex_data.category,
            target=ex_data.target,
            equipment=ex_data.equipment,
            gif_url=ex_data.gif_url,
            order=ex_data.order,
            target_sets=ex_data.target_sets,
            target_reps_min=ex_data.target_reps_min,
            target_reps_max=ex_data.target_reps_max,
            target_weight_lbs=ex_data.target_weight_lbs,
        )
        db.add(exercise)
        await db.flush()

        for set_data in ex_data.sets:
            db.add(WorkoutLogSet(
                id=uuid4(),
                workout_log_exercise_id=exercise.id,
                set_number=set_data.set_number,
                reps=set_data.reps,
                weight_lbs=set_data.weight_lbs,
                completed=set_data.completed,
            ))

    await db.flush()
    await update_user_streak(db, current_user.id)
    await db.commit()

    return await load_workout_log_response(db, log_id, current_user.id)


@router.delete("/{log_id}/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise_from_log(
    log_id: UUID,
    exercise_id: UUID,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Remove an exercise and its sets from a workout log."""
    log_result = await db.execute(
        select(WorkoutLog)
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.user_id == current_user.id)
    )
    if not log_result.scalars().first():
        raise HTTPException(status_code=404, detail="Workout log not found")

    result = await db.execute(
        select(WorkoutLogExercise)
        .where(WorkoutLogExercise.id == exercise_id)
        .where(WorkoutLogExercise.workout_log_id == log_id)
    )
    exercise = result.scalars().first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    await db.delete(exercise)
    await db.commit()


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
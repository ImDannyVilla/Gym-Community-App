from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID, uuid4

from app.models.routine import Routine, RoutineExercise
from app.models.workout_log import WorkoutLog, WorkoutLogExercise
from app.schemas.routine import (
    RoutineCreate, RoutineUpdate,
    RoutineSummary, RoutineResponse
)
from app.dependencies import AsyncSessionDep, CurrentUser

router = APIRouter(prefix="/routines", tags=["Routines"])


@router.post("/", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def create_routine(
    data: RoutineCreate,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """create a new routine with exercises."""
    routine = Routine(
        id=uuid4(),
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        is_public=data.is_public,
    )
    db.add(routine)
    await db.flush()

    for ex_data in data.exercises:
        exercise = RoutineExercise(
            id=uuid4(),
            routine_id=routine.id,
            exercise_id=ex_data.exercise_id,
            name=ex_data.name,
            gif_url=ex_data.gif_url,
            category=ex_data.category,
            target=ex_data.target,
            equipment=ex_data.equipment,
            order=ex_data.order,
            target_sets=ex_data.target_sets,
            target_reps_min=ex_data.target_reps_min,
            target_reps_max=ex_data.target_reps_max,
            target_weight_lbs=ex_data.target_weight_lbs,
            notes=ex_data.notes,
        )
        db.add(exercise)

    await db.commit()

    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == routine.id)
    )
    return result.scalars().first()


@router.get("/me", response_model=List[RoutineResponse])
async def get_my_routines(
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Get all routines for the current user."""
    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.user_id == current_user.id)
        .order_by(Routine.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{routine_id}", response_model=RoutineResponse)
async def get_routine(
    routine_id: UUID,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """get a specific routine with all exercises."""
    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == routine_id)
        .where(
            (Routine.user_id == current_user.id) |
            (Routine.is_public == True)
        )
    )
    routine = result.scalars().first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine


@router.put("/{routine_id}", response_model=RoutineResponse)
async def update_routine(
    routine_id: UUID,
    data: RoutineUpdate,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """update routine name, description, or public/private status."""
    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == routine_id)
        .where(Routine.user_id == current_user.id)
    )
    routine = result.scalars().first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    if data.name is not None:
        routine.name = data.name
    if data.description is not None:
        routine.description = data.description
    if data.is_public is not None:
        routine.is_public = data.is_public

    if data.exercises is not None:
        await db.execute(
            delete(RoutineExercise).where(RoutineExercise.routine_id == routine_id)
        )
        for ex_data in data.exercises:
            db.add(RoutineExercise(
                id=uuid4(),
                routine_id=routine.id,
                exercise_id=ex_data.exercise_id,
                name=ex_data.name,
                gif_url=ex_data.gif_url,
                category=ex_data.category,
                target=ex_data.target,
                equipment=ex_data.equipment,
                order=ex_data.order,
                target_sets=ex_data.target_sets,
                target_reps_min=ex_data.target_reps_min,
                target_reps_max=ex_data.target_reps_max,
                target_weight_lbs=ex_data.target_weight_lbs,
                notes=ex_data.notes,
            ))

    await db.commit()

    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == routine_id)
    )
    return result.scalars().first()


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_routine(
    routine_id: UUID,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Delete a routine."""
    result = await db.execute(
        select(Routine)
        .where(Routine.id == routine_id)
        .where(Routine.user_id == current_user.id)
    )
    routine = result.scalars().first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    await db.delete(routine)
    await db.commit()


@router.post("/{routine_id}/exercises", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def add_exercise_to_routine(
    routine_id: UUID,
    data: RoutineCreate,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Add exercises to an existing routine."""
    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == routine_id)
        .where(Routine.user_id == current_user.id)
    )
    routine = result.scalars().first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")

    for ex_data in data.exercises:
        exercise = RoutineExercise(
            id=uuid4(),
            routine_id=routine.id,
            exercise_id=ex_data.exercise_id,
            name=ex_data.name,
            gif_url=ex_data.gif_url,
            category=ex_data.category,
            target=ex_data.target,
            equipment=ex_data.equipment,
            order=ex_data.order,
            target_sets=ex_data.target_sets,
            target_reps_min=ex_data.target_reps_min,
            target_reps_max=ex_data.target_reps_max,
            target_weight_lbs=ex_data.target_weight_lbs,
            notes=ex_data.notes,
        )
        db.add(exercise)

    await db.commit()

    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == routine_id)
    )
    return result.scalars().first()

@router.post("/{log_id}/copy", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def copy_workout_log_as_routine(
    log_id: UUID,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """
    Copy another user's public workout log as a new routine.
    """
    result = await db.execute(
        select(WorkoutLog)
        .options(
            selectinload(WorkoutLog.exercises)
            .selectinload(WorkoutLogExercise.sets)
        )
        .where(WorkoutLog.id == log_id)
        .where(WorkoutLog.is_public == True)
    )
    original = result.scalars().first()

    if not original:
        raise HTTPException(status_code=404, detail="Workout log not found or is not public")

    if original.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot copy your own workout log")

    # Create routine from log
    new_routine = Routine(
        id=uuid4(),
        user_id=current_user.id,
        name=original.name,
        description=f"Copied from a workout log",
        is_public=False,
    )
    db.add(new_routine)
    await db.flush()

    # Copy exercises — use last set's weight as target weight
    for order, ex in enumerate(original.exercises, start=1):
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
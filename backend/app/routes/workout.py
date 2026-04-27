from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID, uuid4

from app.models.seededWorkout import SeededWorkout
from app.models.seeded_workout_exercise import SeededWorkoutExercise
from app.models.routine import Routine, RoutineExercise
from app.schemas.workout import SeededWorkoutSummary, SeededWorkoutResponse
from app.schemas.routine import RoutineResponse
from app.dependencies import AsyncSessionDep, CurrentUser

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

@router.post("/seeded/{workout_id}/save-as-routine", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
async def save_seeded_workout_as_routine(
    workout_id: UUID,
    db: AsyncSessionDep,
    current_user: CurrentUser
):
    """Save a seeded workout to user's routines"""
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

    new_routine = Routine(
        id=uuid4(),
        user_id=current_user.id,
        name=workout.name,
        description=workout.description or f"Saved from {workout.name} program",
        is_public=False,
    )
    db.add(new_routine)
    await db.flush()

    for ex in workout.exercises:
        routine_ex = RoutineExercise(
            id=uuid4(),
            routine_id=new_routine.id,
            exercise_id=ex.exercise_library.id if ex.exercise_library else None,
            name=ex.exercise_library.name if ex.exercise_library else ex.name,
            gif_url=ex.exercise_library.gif_url if ex.exercise_library else None,
            category=ex.exercise_library.category if ex.exercise_library else None,
            target=ex.exercise_library.target if ex.exercise_library else None,
            equipment=ex.exercise_library.equipment if ex.exercise_library else None,
            order=ex.order,
            target_sets=ex.sets,
            target_reps_min=int(ex.reps.split("-")[0]) if ex.reps and "-" in ex.reps else (int(ex.reps) if ex.reps and ex.reps.isdigit() else 8),
            target_reps_max=int(ex.reps.split("-")[1]) if ex.reps and "-" in ex.reps else (int(ex.reps) if ex.reps and ex.reps.isdigit() else 12),
            target_weight_lbs=None,
            notes=ex.notes,
        )
        db.add(routine_ex)

    await db.commit()

    result = await db.execute(
        select(Routine)
        .options(selectinload(Routine.exercises))
        .where(Routine.id == new_routine.id)
    )
    return result.scalars().first()
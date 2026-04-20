"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db import get_db
from app.models.program import Program, ProgramDay
from app.schemas.program import ProgramResponse, ProgramSummary
from app.dependencies import AsyncSessionDep

router = APIRouter(prefix="/programs", tags=["Programs"])


@router.get("/", response_model=List[ProgramSummary])
async def get_all_programs(db: AsyncSessionDep):
#get all preset programs
    result = await db.execute(
        select(Program)
        .where(Program.is_preset == True)  # Only grab the ones marked as preset
        .order_by(Program.difficulty, Program.days_per_week)  # Sort: beginner first
    )
    programs = result.scalars().all()
    return programs


@router.get("/{program_id}", response_model=ProgramResponse)
async def get_program_detail(
        program_id: int,
        db: AsyncSessionDep
):
    here you get program with full schedule.

    Returns:
    {
        "id": 1,
        "name": "3-Day Push/Pull/Legs",
        "description": "Classic beginner split...",
        "difficulty": "Beginner",
        "days_per_week": 3,
        "duration_weeks": 8,
        "schedule": [
            {
                "day_of_week": 1,
                "workout": {
                    "id": 1,
                    "name": "Chest and Triceps",
                    "category": "Push"
                }
            }
        ]
    }
    result = await db.execute(
        select(Program).where(Program.id == program_id)
    )
    program = result.scalars().first()

    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found"
        )

    return program


@router.get("/difficulty/{difficulty}", response_model=List[ProgramSummary])
async def get_programs_by_difficulty(
        difficulty: str,
        db: AsyncSessionDep
):

    result = await db.execute(
        select(Program)
        .where(Program.difficulty == difficulty)
        .where(Program.is_preset == True)
        .order_by(Program.days_per_week)
    )
    programs = result.scalars().all()

    return programs

"""
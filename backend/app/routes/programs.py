from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db import get_db
from app.models.program import Program, ProgramDay
from app.schemas.program import ProgramResponse, ProgramSummary


router = APIRouter(prefix="/programs", tags=["Programs"])

@router.get("/", response_model=List[ProgramSummary])
async def get_all_programs(db: AsyncSession = Depends(get_db)):
    #Get all preset programs.
    #returns: ["3-Day PPL", "5-Day SPlit" ..etc
    result = await db.execute(
        select(Program)
        .where(Program.is_preset) #only grab the ones makrked as preset
        .order_by(Program.difficulty, Program.days_per_week) # Sort the final list so all 'beginner' programs are first'
    )
    programs = result.scalars().all()
    return programs


async def get_program_detail(program_id: int, db: AsyncSession):
    #Get program with full details
    Returns:
    {
        "name":
    }
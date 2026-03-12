from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

# The nested schemas for related data
class WorkoutInSchedule(BaseModel):
    """Simplified workout information for program schedule."""
    id: int
    name: str
    category: Optional[str] = None
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class ProgramDayResponse(BaseModel):
    """A single day in the program schedule."""
    id: int
    day_of_week: int #1=Monday, 2=Tuesday, etc.
    week_number: int
    workout: WorkoutInSchedule #Nested workout info

    model_config = ConfigDict(from_attributes=True)

#the program chemas
class ProgramBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: Optional[str] = None
    days_per_week: int
    duration_weeks: Optional[int] = None


class ProgramSummary(ProgramBase):
    """Program list view (no schedule details)"""
    id: int
    is_preset: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProgramResponse(ProgramBase):
    """Full program details with schedule"""
    id: int
    is_preset: bool
    created_at: datetime
    schedule: List[ProgramDayResponse] = []  # Full weekly schedule

    model_config = ConfigDict(from_attributes=True)


class ProgramCreate(ProgramBase):
    """data for creating a program (future use maybe ??)"""
    pass
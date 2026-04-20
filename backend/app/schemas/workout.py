from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class SeededWorkoutExerciseResponse(BaseModel):
    id: UUID
    exercise_library_id: UUID
    name: str
    sets: int
    reps: int
    rest_period_seconds: Optional[int] = None
    order: int
    notes: Optional[str] = None
    gif_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SeededWorkoutSummary(BaseModel):
    """List view — no exercises"""
    id: UUID
    name: str
    category: str
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SeededWorkoutResponse(BaseModel):
    """Detail view — includes exercises"""
    id: UUID
    name: str
    category: str
    difficulty: Optional[str] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    exercises: List[SeededWorkoutExerciseResponse] = []

    model_config = ConfigDict(from_attributes=True)
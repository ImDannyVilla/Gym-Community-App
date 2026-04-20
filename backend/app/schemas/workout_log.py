from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from uuid import UUID


# Sets

class WorkoutLogSetCreate(BaseModel):
    set_number: int
    reps: int
    weight_lbs: float
    completed: bool = False


class WorkoutLogSetResponse(BaseModel):
    id: UUID
    set_number: int
    reps: int
    weight_lbs: float
    completed: bool

    model_config = ConfigDict(from_attributes=True)


# Exercises

class WorkoutLogExerciseCreate(BaseModel):
    exercise_id: str          # from exercise library
    name: str
    category: Optional[str] = None
    target: Optional[str] = None
    equipment: Optional[str] = None
    gif_url: Optional[str] = None
    order: int
    sets: List[WorkoutLogSetCreate] = []


class WorkoutLogExerciseResponse(BaseModel):
    id: UUID
    exercise_id: str
    name: str
    category: Optional[str] = None
    target: Optional[str] = None
    equipment: Optional[str] = None
    gif_url: Optional[str] = None
    order: int
    sets: List[WorkoutLogSetResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Workout Log

class WorkoutLogCreate(BaseModel):
    name: str
    routine_id: Optional[UUID] = None
    is_public: bool = False


class WorkoutLogUpdate(BaseModel):
    name: Optional[str] = None
    is_public: Optional[bool] = None
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None

class WorkoutLogSummary(BaseModel):
    """List view — no exercises"""
    id: UUID
    name: str
    is_public: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    routine_id: Optional[UUID] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class WorkoutLogResponse(BaseModel):
    """Detail view — includes exercises and sets"""
    id: UUID
    name: str
    is_public: bool
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    routine_id: Optional[UUID] = None
    exercises: List[WorkoutLogExerciseResponse] = []
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
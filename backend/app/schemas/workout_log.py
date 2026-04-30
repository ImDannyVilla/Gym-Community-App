from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID


# Sets

class WorkoutLogSetCreate(BaseModel):
    set_number: int = Field(ge=1)
    reps: int = Field(ge=0, le=1000)
    weight_lbs: float = Field(ge=0.0, le=5000.0)
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
    name: str = Field(min_length=1, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    target: Optional[str] = Field(None, max_length=50)
    equipment: Optional[str] = Field(None, max_length=50)
    gif_url: Optional[str] = None
    order: int = Field(ge=0)
    target_sets: Optional[int] = None
    target_reps_min: Optional[int] = None
    target_reps_max: Optional[int] = None
    target_weight_lbs: Optional[float] = None
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
    target_sets: Optional[int] = None
    target_reps_min: Optional[int] = None
    target_reps_max: Optional[int] = None
    target_weight_lbs: Optional[float] = None
    sets: List[WorkoutLogSetResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Workout Log

class WorkoutLogCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    routine_id: Optional[UUID] = None
    is_public: bool = False


class WorkoutLogUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_public: Optional[bool] = None
    completed_at: Optional[datetime] = None
    duration: Optional[int] = Field(None, ge=0)
    media_url: Optional[str] = None
    media_type: Optional[str] = Field(None, max_length=50)
    caption: Optional[str] = Field(None, max_length=1000)

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


class PublicFeedPost(BaseModel):
    """Public feed item — log with poster profile fields"""
    id: UUID
    name: str
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None
    user_id: UUID
    user_name: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    exercise_count: int = 0


class PublicWorkoutLogResponse(BaseModel):
    """Full public workout log detail with poster info and all exercises/sets"""
    id: UUID
    name: str
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    caption: Optional[str] = None
    user_id: UUID
    user_name: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    exercises: List[WorkoutLogExerciseResponse] = []

    model_config = ConfigDict(from_attributes=True)
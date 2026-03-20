from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from .exercise import ExerciseResponse, ExerciseCreate

# Workout Schemas
class WorkoutBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None  # "Push", "Pull", "Legs"
    difficulty: Optional[str] = None  # "Beginner", "Intermediate", "Advanced"
    duration_minutes: Optional[int] = None

#data to create workot
class WorkoutCreate(WorkoutBase):
    exercises: Optional[List[ExerciseCreate]] = []

#wokout data going to front end
class WorkoutResponse(WorkoutBase):
    id: int
    category:str
    is_preset: bool
    created_at: datetime
    exercises: List[ExerciseResponse] = []

    model_config = ConfigDict(from_attributes=True)

#Workout list view (no exercises)
class WorkoutSummary(WorkoutBase):
    id: int
    is_preset: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
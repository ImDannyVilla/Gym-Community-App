from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from uuid import UUID


# Routine Exercise

class RoutineExerciseCreate(BaseModel):
    exercise_id: str
    name: str
    gif_url: Optional[str] = None
    category: Optional[str] = None
    target: Optional[str] = None
    equipment: Optional[str] = None
    order: int
    target_sets: int
    target_reps: Optional[int] = None
    target_weight_lbs: Optional[int] = None
    notes: Optional[str] = None


class RoutineExerciseResponse(BaseModel):
    id: UUID
    exercise_id: str
    name: str
    gif_url: Optional[str] = None
    category: Optional[str] = None
    target: Optional[str] = None
    equipment: Optional[str] = None
    order: int
    target_sets: int
    target_reps: Optional[int] = None
    target_weight_lbs: Optional[int] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Routine

class RoutineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    exercises: List[RoutineExerciseCreate] = []


class RoutineUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    exercises: Optional[List[RoutineExerciseCreate]] = None


class RoutineSummary(BaseModel):
    """List view- no exercises"""
    id: UUID
    name: str
    description: Optional[str] = None
    is_public: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoutineResponse(BaseModel):
    """Detail view - includes exercises"""
    id: UUID
    name: str
    description: Optional[str] = None
    is_public: bool
    created_at: datetime
    exercises: List[RoutineExerciseResponse] = []

    model_config = ConfigDict(from_attributes=True)
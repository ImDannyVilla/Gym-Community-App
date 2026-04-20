from datetime import datetime

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from app.schemas.workout_log import WorkoutLogSetResponse

class ExerciseLibraryResponse(BaseModel):
    id: UUID
    exercise_id: str
    name: str
    category: Optional[str] = None
    target: Optional[str] = None
    equipment: Optional[str] = None
    gif_url: Optional[str] = None
    secondary_muscles: Optional[str] = None
    instructions: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ExerciseHistoryResponse(BaseModel):
    exercise_id: str
    name: str
    last_performed: datetime
    sets: List[WorkoutLogSetResponse] = []

    model_config = ConfigDict(from_attributes=True)

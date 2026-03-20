from pydantic import BaseModel, ConfigDict
from typing import Optional

#common base

class ExerciseBase(BaseModel):
    exercise_id: str
    name: str
    gif_url: Optional[str] = None
    sets: int
    reps: int
    rest_period_seconds: Optional[int] = 60
    order: int
    notes: Optional[str] = None

#for creating (what frontend sends  0
class ExerciseCreate(ExerciseBase):
    pass

#for responses (what frontend receives)
class ExerciseResponse(ExerciseBase):
    id: int
    workout_id: int

    model_config = ConfigDict(from_attributes=True)
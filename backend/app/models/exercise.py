from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.models.workout import Workout
from ..db import Base
from typing import Optional

class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    workout_id: Mapped[int] = mapped_column(ForeignKey("workouts.id"), nullable=False)

    # From ExerciseDB API
    exercise_id: Mapped[Optional[str]] = mapped_column(String) # ExerciseDB ID like "0025"
    name: Mapped[Optional[str]] = mapped_column(String)
    body_part: Mapped[Optional[str]] = mapped_column(String)  # "chest", "back"
    target: Mapped[Optional[str]] = mapped_column(String)  # "pectorals", "lats", "biceps", etc...
    gif_url: Mapped[Optional[str]] = mapped_column(String)  # Demo GIF URL

    # For WorkoutDB data
    reps: Mapped[int] = mapped_column(nullable=False)
    sets: Mapped[int] = mapped_column(nullable=False)
    rest_period_seconds: Mapped[int]  = mapped_column()
    order: Mapped[int] = mapped_column(nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    workout: Mapped["Workout"] = relationship("Workout", back_populates="exercises")

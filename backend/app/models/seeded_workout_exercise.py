from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from uuid import UUID, uuid4
from app.db import Base, GUID
from app.models.exerciseLibrary import ExerciseLibrary


class SeededWorkoutExercise(Base):
    __tablename__ = "seeded_workout_exercises"

    id: Mapped[UUID] = mapped_column(GUID(as_uuid=True), primary_key=True, default=uuid4)
    seeded_workout_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        ForeignKey("seeded_workouts.id", ondelete="CASCADE")
    )
    exercise_library_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        ForeignKey("exercise_library.id", ondelete="CASCADE")
    )
    # in seeded_workout_exercise.py
    gif_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sets: Mapped[int] = mapped_column(Integer, nullable=False)
    reps: Mapped[int] = mapped_column(Integer, nullable=False)
    rest_period_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    exercise_library = relationship("ExerciseLibrary")
    workout = relationship("SeededWorkout", back_populates="exercises")
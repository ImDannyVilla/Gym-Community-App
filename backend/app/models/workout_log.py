from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from ..db import Base
from typing import Optional, List
from datetime import datetime
from uuid import UUID, uuid4
from app.db import GUID

class WorkoutLog(Base):
    """user workout session performed"""
    __tablename__ = "workout_logs"

    id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE")
    )
    routine_id: Mapped[Optional[UUID]] = mapped_column(
        GUID(as_uuid=True),
        ForeignKey("routines.id", ondelete="SET NULL")
    )
    name: Mapped[str]
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)

    media_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    media_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # "photo" or "video"
    caption: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    duration: Mapped[Optional[int]]
    exercises: Mapped[List["WorkoutLogExercise"]] = relationship(
        "WorkoutLogExercise", back_populates="workout_logs", cascade="all, delete-orphan"
    )

class WorkoutLogExercise(Base):
    """Exercise performed during a workout log session"""
    __tablename__ = "workout_log_exercises"

    id: Mapped[UUID] = mapped_column(GUID(as_uuid=True), primary_key=True, default=uuid4)
    workout_log_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        ForeignKey("workout_logs.id", ondelete="CASCADE")
    )
    # ExerciseLibrary reference
    exercise_id: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    category: Mapped[Optional[str]] = mapped_column(String)
    target: Mapped[Optional[str]] = mapped_column(String)
    equipment: Mapped[Optional[str]] = mapped_column(String)
    gif_url: Mapped[Optional[str]] = mapped_column(String)

    order: Mapped[int] = mapped_column(Integer)

    workout_logs: Mapped["WorkoutLog"] = relationship(
        "WorkoutLog", back_populates="exercises"
    )
    sets: Mapped[List["WorkoutLogSet"]] = relationship(
        "WorkoutLogSet", back_populates="workout_log_exercise", cascade="all, delete-orphan"
    )

class WorkoutLogSet(Base):
    """many to many relationship between workout logs and exercises"""
    __tablename__ = "workout_log_sets"

    id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    workout_log_exercise_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        ForeignKey("workout_log_exercises.id")
    )
    set_number: Mapped[int]
    reps: Mapped[int] #Actual reps done
    weight_lbs: Mapped[float] #Actual weight done
    completed: Mapped[bool]

    workout_log_exercise: Mapped["WorkoutLogExercise"] = relationship(
        "WorkoutLogExercise", back_populates="sets"
    )


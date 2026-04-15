from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from ..db import Base
from typing import Optional, List
from datetime import datetime

class WorkoutLog(Base):
    """user workout session performed"""
    __tablename__ = "workout_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    routine_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("routines.id", ondelete="SET NULL")
    )
    name: Mapped[str]
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    duration: Mapped[Optional[int]]
    exercises: Mapped[List["WorkoutLogExercise"]] = relationship(
        "WorkoutLogExercise", back_populates="workout_logs", cascade="all, delete-orphan"
    )

class WorkoutLogExercise(Base):
    """many to many relationship between workout logs and exercises"""
    __tablename__ = "workout_log_exercises"

    id: Mapped[int] = mapped_column( Integer, primary_key=True )
    workout_log_id: Mapped[int] = mapped_column( Integer, ForeignKey("workout_logs.id", ondelete="CASCADE") )
    #ExerciseDB reference
    exercise_id: Mapped[str]  # "0001"
    name: Mapped[str]  # "Barbell Bench Press"
    body_part: Mapped[Optional[str]]  # "chest"
    target: Mapped[Optional[str]]  # "pectorals"
    gif_url: Mapped[Optional[str]]

    order: Mapped[int]

    workout_logs: Mapped["WorkoutLog"] = relationship(
        "WorkoutLog", back_populates="exercises"
    )
    sets: Mapped[List["WorkoutLogSet"]] = relationship(
        "WorkoutLogSet", back_populates="workout_log_exercise"
    )

class WorkoutLogSet(Base):
    """many to many relationship between workout logs and exercises"""
    __tablename__ = "workout_log_sets"

    id: Mapped[int] = mapped_column( Integer, primary_key=True )
    workout_log_exercise_id: Mapped[int] = mapped_column(ForeignKey("workout_log_exercises.id") )
    set_number: Mapped[int]
    reps: Mapped[int] #Actual reps done
    weight_lbs: Mapped[float] #Actual weight done
    completed: Mapped[bool]

    workout_log_exercise: Mapped["WorkoutLogExercise"] = relationship(
        "WorkoutLogExercise", back_populates="sets"
    )


from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from ..db import Base
from typing import Optional
from uuid import UUID, uuid4
from app.db import GUID

class Routine(Base):
    """users saved workout routines like push, pull, leg, etc..."""
    __tablename__ = "routines"

    id: Mapped[UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid4,
        index=True
    )
    #It identifies which user "owns" or created this specific routine.
    #It ensures that you cannot have a routine that isn't connected to a valid user
    user_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id")
    )
    name: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    exercises = relationship(
        "RoutineExercise",
        back_populates="routine",
        cascade="all, delete-orphan"
    )
class RoutineExercise(Base):
    """many to many relationship between routines and exercises"""
    __tablename__ = "routine_exercises"

    id: Mapped[UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid4
    )
    routine_id: Mapped[UUID] = mapped_column(
        GUID(),
        ForeignKey("routines.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[str] #exercise db reference id
    name: Mapped[str]
    gif_url: Mapped[Optional[str]]
    category: Mapped[Optional[str]] = mapped_column(String)
    target: Mapped[Optional[str]] = mapped_column(String)
    equipment: Mapped[Optional[str]] = mapped_column(String)
    order: Mapped[int]

    # Target values (goals)
    target_sets: Mapped[int]
    target_reps: Mapped[Optional[int]]
    target_weight_lbs: Mapped[Optional[int]] #may add kg option...
    notes: Mapped[Optional[str]]

    routine = relationship("Routine", back_populates="exercises")
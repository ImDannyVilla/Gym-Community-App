from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from ..db import Base
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from uuid import UUID, uuid4
from app.db import Base

class Workout(Base):
    __tablename__ = "workouts"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    category: Mapped[str] = mapped_column(nullable=False)
    difficulty: Mapped[Optional[str]] = mapped_column(nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(nullable=True)
    is_preset: Mapped[bool] = mapped_column(default=True)
    created_by_admin: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(onupdate=func.now())

    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")
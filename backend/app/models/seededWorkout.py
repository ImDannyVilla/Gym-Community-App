from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from uuid import UUID, uuid4
from typing import Optional
from app.db import Base

class SeededWorkout(Base):
    __tablename__ = "seeded_workouts"  # renamed from "workouts"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4, index=True)
    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    category: Mapped[str] = mapped_column(nullable=False)
    difficulty: Mapped[Optional[str]] = mapped_column(nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(nullable=True)
    is_preset: Mapped[bool] = mapped_column(default=True)
    created_by_admin: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(onupdate=func.now())
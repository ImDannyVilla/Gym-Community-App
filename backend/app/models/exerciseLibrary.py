from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db import GUID
from uuid import UUID, uuid4
from typing import Optional
from app.db import Base

class ExerciseLibrary(Base):
    __tablename__ = "exercise_library"

    id: Mapped[UUID] = mapped_column(GUID(), primary_key=True, default=uuid4)
    exercise_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    category: Mapped[Optional[str]] = mapped_column(String, index=True)
    target: Mapped[Optional[str]] = mapped_column(String, index=True)
    equipment: Mapped[Optional[str]] = mapped_column(String)
    gif_url: Mapped[Optional[str]] = mapped_column(String)
    secondary_muscles: Mapped[Optional[str]] = mapped_column(String)
    instructions: Mapped[Optional[str]] = mapped_column(Text)
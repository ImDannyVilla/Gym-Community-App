from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base

class Workout(Base):
    __tablename__ = "workouts"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text)
    category = Column(String) # "Push", "Pull", "Legs", "Upper Body", "Lower Body"
    difficulty = Column(String) # 'Beginner', 'Intermediate', 'Advanced'
    duration_minutes = Column(Integer)
    is_preset = Column(Boolean, default=True)
    created_by_admin = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    #relationship() - defines a one-to-many relationship between Workout and our exercise class
    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")


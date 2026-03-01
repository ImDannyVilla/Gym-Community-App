from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base

class Workout(Base):
    __tablename__ = "workouts"
    id = Column(Integer)
    name = Column(String) #Chest and Triceps, Back and Biceps, Legs and Quads, etc...
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

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)

    #From ExerciseDB API
    exercise_id = Column(String) #ExerciseDB ID like "0025"
    name = Column(String)
    body_part = Column(String) # "chest", "back"
    target = Column(String)  # "pectorals", "lats", "biceps", etc...
    gif_url = Column(String) #Demo GIF URL

    #For WorkoutDB data
    reps = Column(Integer, nullable=False)
    sets = Column(Integer, nullable=False)
    rest_period_seconds = Column(Integer)
    order = Column(Integer, nullable=False)
    notes = Column(Text)

    workout = relationship("Workout", back_populates="exercises")

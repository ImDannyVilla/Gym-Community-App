from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)

    # From ExerciseDB API
    exercise_id = Column(String)  # ExerciseDB ID like "0025"
    name = Column(String)
    body_part = Column(String)  # "chest", "back"
    target = Column(String)  # "pectorals", "lats", "biceps", etc...
    gif_url = Column(String)  # Demo GIF URL

    # For WorkoutDB data
    reps = Column(Integer, nullable=False)
    sets = Column(Integer, nullable=False)
    rest_period_seconds = Column(Integer)
    order = Column(Integer, nullable=False)
    notes = Column(Text)

    workout = relationship("Workout", back_populates="exercises")

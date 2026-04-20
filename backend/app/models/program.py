from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base

"""
class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String) # 3-Day Push/Pull/Legs
    description = Column(Text) #description of program for user
    difficulty = Column(String) #'Begineer', 'Intermediate', 'Advanced''
    days_per_week = Column(Integer) #3, 4, 5 , or 6
    duration_weeks = Column(Integer) #8, 12, 16
    is_preset = Column(Boolean, default=True)

    program_days = relationship("ProgramDay", back_populates="program")

class ProgramDay(Base):
    __tablename__ = "program_days"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"))
    workout_id = Column(Integer, ForeignKey("workouts.id"))
    day_of_week = Column(Integer)
    week_number = Column(Integer, default = 1)

    program = relationship("Program", back_populates="program_days")
    workout = relationship("Workout")
"""
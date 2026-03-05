from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db import Base

class UserProgram(Base):
    __tablename__ = "user_programs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)  # "Shoulder Focused", "Chest Focused", "Glute Focused", etc..."
    description = Column(Text)
    is_public = Column(Boolean, default=False)  # can other userrrs see it?
    created_at = Column(DateTime)

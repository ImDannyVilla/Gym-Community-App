#User database model

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..db import Base



# app/models/user.py
class User(Base):
    """User database model - represents users table in Supabase"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    #index=True - Makes queries faster (especially email lookups)
    #nullable=False - Can't create user without email/username/password
    #is_active - Lets us deactivate users without deleting them
    #created_at - Timestamp when user registered
    #updated_at - Timestamp when user data changed


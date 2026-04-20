# app/models/user.py
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db import Base, GUID


class User(Base):
    """User authentication model"""
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    # Relationships
    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile", back_populates="user", uselist=False
    )
    followers: Mapped[List["Follow"]] = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following_user"
    )
    following: Mapped[List["Follow"]] = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower_user"
    )


class UserProfile(Base):
    """User profile information"""
    __tablename__ = "user_profiles"

    id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )

    #gym_name: Mapped[str] = mapped_column(String(100), nullable = False)#required at signup

    # user fills these later
    full_name: Mapped[Optional[str]] = mapped_column(String(100))
    user_name: Mapped[Optional[str]] = mapped_column(String(100))
    gym_level: Mapped[Optional[str]] = mapped_column(String(20))  # Beginner/Intermediate/Advanced
    bio: Mapped[Optional[str]] = mapped_column(Text)
    avatar_url: Mapped[Optional[str]] = mapped_column(String)

    # Cached counts
    followers_count: Mapped[int] = mapped_column(Integer, default=0)
    following_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="profile")


class Follow(Base):
    """Social following relationships"""
    __tablename__ = "follows"

    id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    follower_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    following_id: Mapped[UUID] = mapped_column(
        GUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    #relationships
    follower_user: Mapped["User"] = relationship(
        "User", foreign_keys=[follower_id], back_populates="following"
    )
    following_user: Mapped["User"] = relationship(
        "User", foreign_keys=[following_id], back_populates="followers"
    )
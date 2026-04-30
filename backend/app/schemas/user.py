#User Pydantic schemas
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, Literal


def validate_password(v: str) -> str:
    if len(v) == 0:
        raise ValueError("Password cannot be empty")
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if len(v) > 20:
        raise ValueError("Password must be less than 20 characters long")
    if not any(c.isupper() for c in v):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(c.isdigit() for c in v):
        raise ValueError("Password must contain at least one digit")
    if not any(c.islower() for c in v):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(c.isalpha() for c in v):
        raise ValueError("Password must contain at least one letter")
    if not any(not c.isalnum() for c in v):
        raise ValueError("Password must contain at least one special character")
    if any(c.isspace() for c in v):
        raise ValueError("Password must not contain any spaces")
    return v

def validate_username(v: str) -> str:
    if v is not None:
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(v) > 20:
            raise ValueError("Username must be less than 20 characters long")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must contain only letters, numbers, underscores, and hyphens")
    return v

#INPUT SCHEMAS

class UserRegister(BaseModel):
    """
    Data coming FROM React Native during registration.
    """
    email: EmailStr
    password: str
    user_name: str
    full_name: Optional[str] = None

    @field_validator("user_name")
    def username_length(cls, v):
        return validate_username(v)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        return validate_password(v)


class UserLogin(BaseModel):
    """
    Data coming FROM React Native during login.
    """
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    user_name: Optional[str] = None
    gym_level: Optional[Literal['Beginner', 'Intermediate', 'Advanced']] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    weight: Optional[int] = None
    last_workout: Optional[str] = None
    current_workout: Optional[str] = None

# OUTPUT SCHEMAS

class UserResponse(BaseModel):
    """
    User data going TO React Native (safe - no password).
    """
    id: UUID
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProfileResponse(BaseModel):
    id: UUID
    full_name: Optional[str] = None
    user_name: Optional[str] = None
    gym_level: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    weight: Optional[int] = None
    last_workout: Optional[str] = None
    current_workout: Optional[str] = None
    total_workouts: int = 0
    day_streak: int = 0
    followers_count: int = 0
    following_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class UserwithProfile(BaseModel):
    """the user with profile data"""
    id: UUID
    email: EmailStr
    created_at: datetime
    profile: Optional[ProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    """
    Token response going TO React Native.
    React Native stores this token and uses it for future requests.
    """
    access_token: str
    refresh_token: str
    token_type: str
    is_onboarded: bool

class UserUpdate(BaseModel):
    user_name: str | None = None
    email: EmailStr | None = None
    
    @field_validator("user_name")
    def username_length(cls, v):
        return validate_username(v)

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    def password_strength(cls, v):
        return validate_password(v)

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    """Schema for reset password via email link"""
    new_password: str

    @field_validator("new_password")
    def password_strength(cls, v):
        return validate_password(v)

class EmailUpdate(BaseModel):
    new_email: EmailStr

class ResetConfirmation(BaseModel):
    email: EmailStr

class RefreshRequest(BaseModel):
    refresh_token: str

class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class FollowResponse(BaseModel):
    """Response when following/unfollowing a user"""
    is_following: bool
    followers_count: int
    following_count: int

class UserListItem(BaseModel):
    """Minimal user info for follower/following lists"""
    id: UUID
    user_name: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    followers_count: int
    is_following: bool  # Whether current user follows this user

    model_config = ConfigDict(from_attributes=True)
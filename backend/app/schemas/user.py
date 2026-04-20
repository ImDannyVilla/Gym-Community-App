#User Pydantic schemas
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from typing import Optional


#INPUT SCHEMAS

class UserRegister(BaseModel):
    """
    Data coming FROM React Native during registration.
    """
    email: EmailStr
    password: str
    @field_validator("password")
    def password_strength(cls, v):
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
            raise ValueError(
                "Password must not contain any spaces"
            )
        return v


class OnboardingData(BaseModel):
    """
    Profile data collected during onboarding (step 2).
    """
    user_name: str
    full_name: Optional[str] = None
    gym_level: Optional[str] = None  # "Beginner", "Intermediate", "Advanced"
    avatar_url: Optional[str] = None

    @field_validator("user_name")
    def username_length(cls, v):
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(v) > 20:
            raise ValueError("Username must be less than 20 characters long")
        if not v.isalnum():
            raise ValueError("Username must contain only letters and numbers")
        return v

    @field_validator("gym_level")
    def gym_level_valid(cls, v):
        if v is not None:
            cases = ["Beginner", "Intermediate", "Advanced"]
            if v not in cases:
                raise ValueError("Gym level must be one of: Beginner, Intermediate, Advanced")
        return v


class UserLogin(BaseModel):
    """
    Data coming FROM React Native during login.
    """
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    user_name: Optional[str] = None
    #gym_name: Optional[str] = None
    gym_level: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None



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
    token_type: str
    is_onboarded: bool

class UserUpdate(BaseModel):
    user_name: str | None = None
    email: EmailStr | None = None
    
    @field_validator("user_name")
    def username_length(cls, v):
        if v is not None:
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters long")
            if len(v) > 20:
                raise ValueError("Username must be less than 20 characters long")
            if not v.isalnum():
                raise ValueError("Username must contain only letters and numbers")
        return v

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    def password_strength(cls, v):
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
            raise ValueError(
                "Password must not contain any spaces"
            )
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    """Schema for reset password via email link"""
    new_password: str

    @field_validator("new_password")
    def password_strength(cls, v):
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

class EmailUpdate(BaseModel):
    new_email: EmailStr

class ResetConfirmation(BaseModel):
    email: EmailStr
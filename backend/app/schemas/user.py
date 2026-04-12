#User Pydantic schemas
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from datetime import datetime
from typing import Optional


#INPUT SCHEMAS

class UserRegister(BaseModel):
    """
    Data coming FROM React Native during registration.
    """
    email: EmailStr
    username: str
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
    @field_validator("username")
    def username_length(cls, v):
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters long")
        if len(v) > 20:
            raise ValueError("Username must be less than 20 characters long")
        if not v.isalnum():
            raise ValueError("Username must contain only letters and numbers")
        return v


class UserLogin(BaseModel):
    """
    Data coming FROM React Native during login.
    """
    email: EmailStr
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    gym_name: Optional[str] = None
    gym_level: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None



# OUTPUT SCHEMAS

class UserResponse(BaseModel):
    """
    User data going TO React Native (safe - no password).
    """
    id: int
    email: EmailStr
    username: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProfileResponse(BaseModel):
    """"profile data"""
    id: int
    full_name: Optional[str]
    gym_name: Optional[str]
    gym_level: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    followers_count: int
    following_count: int

    model_config = ConfigDict(from_attributes=True)

class UserwithProfile(BaseModel):
    """the user with profile data"""
    id: int
    email: EmailStr
    username: str
    created_at: datetime
    profile: Optional[ProfileResponse]

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    """
    Token response going TO React Native.
    React Native stores this token and uses it for future requests.
    """
    access_token: str
    token_type: str

class UserUpdate(BaseModel):
    """
    Data for updating user profile.
    """
    username: str | None = None
    email: EmailStr | None = None
    
    @field_validator("username")
    def username_length(cls, v):
        if v is not None:
            if len(v) < 3:
                raise ValueError("Username must be at least 3 characters long")
            if len(v) > 20:
                raise ValueError("Username must be less than 20 characters long")
            if not v.isalnum():
                raise ValueError("Username must contain only letters and numbers")
        return v

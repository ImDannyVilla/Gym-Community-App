#User Pydantic schemas
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator


class UserRegister(BaseModel):
    """
    Data coming FROM React Native during registration.
    """
    email: EmailStr
    username: str
    password: str
    @field_validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
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


class Token(BaseModel):
    """
    Token response going TO React Native.
    React Native stores this token and uses it for future requests.
    """
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    """
    User data going TO React Native (safe - no password).
    """
    id: int
    email: str
    username: str

    model_config = ConfigDict(from_attributes=True)


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
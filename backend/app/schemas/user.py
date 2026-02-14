#User Pydantic schemas
from pydantic import BaseModel, EmailStr, ConfigDict


class UserRegister(BaseModel):
    """
    Data coming FROM React Native during registration.
    """
    email: EmailStr
    username: str
    password: str


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

    model_config = ConfigDict(from_attributes=True)  # Updated syntax for Pydantic v2
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, Token

router = APIRouter(prefix="/auth", tags=["auth"]) #all routes start with /auth; in API they are grouped under auth

@router.post("/register")
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    #check if email is already taken
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    if result.scalars().first():
        raise HTTPException(
            status_code=400, detail="Email already registered"
        )
    #Check is username is already taken
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )

    if result.scalars().first():
        raise HTTPException(
            status_code=400, detail="Username already registered"
        )

    hashed_password = get_password_hash(user_data.password)

    #save user to db
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password
    )
    db.add(new_user)
    await db.commit() #SQLAlchemy puts that user object into a Session where it stages the changes to the database.

    #creating jwt token
    token = create_access_token(data={"sub": user_data.email})

    #retunr token to react native
    return Token(access_token=token, token_type="bearer")

@router.post("/login")
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalars().first() #.scalars() unwraps the database result so you get the actual User object instead of a wrapped Row object.

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": user.email})
    return Token(access_token=token, token_type="bearer")

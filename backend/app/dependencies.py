from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import ALGORITHM, SECRET_KEY
from app.models.user import User
from app.db import get_db

# This tells FastAPI where to look for the token (the /auth/login route)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(
        token: Annotated[str, Depends(oauth2_scheme)],
        db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"RAW TOKEN RECEIVED: {token}") # Is it null?
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DECODED PAYLOAD: {payload}") # What is actually inside 'sub'?
        
        email: str = payload.get("sub")
        if email is None:
            print("FAILED: 'sub' claim is missing from payload")
            raise credentials_exception
            
    except JWTError as e:
        print(f"JWT DECODE FAILED: {e}") # Why did it fail?
        raise credentials_exception

    # Find the user in the database
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()

    if user is None:
        raise credentials_exception
    return user

#Type alias for the database session
AsyncSessionDep = Annotated[AsyncSession, Depends(get_db)] #async def get_workouts(db: AsyncSessionDep):

# Type alias for easy use in routers
CurrentUser = Annotated[User, Depends(get_current_user)]

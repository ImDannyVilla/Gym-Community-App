from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.supabase_client import supabase
from app.models.user import User
from app.db import get_db

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
        user_response = supabase.auth.get_user(token)

        if not user_response.user:
            raise credentials_exception

        result = await db.execute(
            select(User).where(User.id == user_response.user.id)
        )
        user = result.scalars().first()

        if user is None:
            raise credentials_exception

        return user

    except Exception as e:
        import logging
        logging.warning(f"Authentication error: {e}")
        raise credentials_exception


AsyncSessionDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
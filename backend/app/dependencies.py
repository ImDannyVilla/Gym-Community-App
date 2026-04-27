from typing import Annotated
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core.supabase_client import get_auth_client
from app.models.user import User
from app.db import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

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
        user_id = None
        
        # Fast local JWT validation if secret is provided
        if SUPABASE_JWT_SECRET:
            try:
                payload = jwt.decode(
                    token, 
                    SUPABASE_JWT_SECRET, 
                    algorithms=["HS256"], 
                    options={"verify_aud": False}
                )
                user_id = payload.get("sub")
                if user_id is None:
                    raise credentials_exception
            except JWTError:
                raise credentials_exception
        else:
            # Fallback to network call if no secret is provided
            auth_client = get_auth_client()
            user_response = auth_client.auth.get_user(token)
            if not user_response.user:
                raise credentials_exception
            user_id = user_response.user.id

        result = await db.execute(
            select(User).where(User.id == user_id)
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
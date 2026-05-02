from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.models.user import User, UserProfile
from app.schemas.user import (
    UserRegister,
    UserLogin,
    Token,
    PasswordReset,
    PasswordResetRequest,
    ResetConfirmation,
    RefreshRequest,
    RefreshResponse,
    UserwithProfile
)
from app.dependencies import AsyncSessionDep, CurrentUser
from app.core.supabase_client import get_auth_client

_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["auth"]) #all routes start with /auth; in API they are grouped under auth


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
        user_data: UserRegister,
        db: AsyncSessionDep
):
    try:
        #checking if username is already taken
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_name == user_data.user_name)
        )
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Username already taken")


        # create user in supabase auth (skip email confirmation)
        auth_client = get_auth_client()
        auth_response = auth_client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Registration failed")

        user_id = UUID(auth_response.user.id)

        # save user to User table
        new_user = User(
            id=user_id,
            email=user_data.email,
            is_active=True,
        )
        db.add(new_user)
        await db.flush()

        # Create the empty profile
        new_profile = UserProfile(
            user_id=new_user.id,
            user_name=user_data.user_name,
            full_name=user_data.full_name
        )
        db.add(new_profile)

        await db.commit()
        await db.refresh(new_user)
        return {"message": "Registration successful. You can now log in."}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Registration Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")



@router.post("/login", response_model=Token)
async def login(db: AsyncSessionDep, credentials: OAuth2PasswordRequestForm = Depends()):
    try:
        auth_client = get_auth_client()
        auth_response = auth_client.auth.sign_in_with_password({
            "email": credentials.username,
            "password": credentials.password
        })

        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user_id = UUID(auth_response.user.id)

        # Since username is now required at registration, users are always onboarded
        return Token(
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token,
            token_type="bearer",
            is_onboarded=True
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail="Invalid credentials")
@router.post("/request-password-reset")
async def request_password_reset(data: PasswordResetRequest):
    try:
        auth_client = get_auth_client()
        auth_client.auth.reset_password_for_email(
            email= data.email,
            options={
                "redirect_to": "gym_app://reset-password"
            }
        )
        return {"message": "If the email exists, a reset link will be sent."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/forgot-email")
async def forgot_email(username: str, db: AsyncSessionDep):
    """Find email associated with a username."""
    try:
        result = await db.execute(
            select(User)
            .join(UserProfile, UserProfile.user_id == User.id)
            .where(UserProfile.user_name == username)
        )
        user = result.scalars().first()

        if not user:
            return {"email": None, "message": "No account found with this username"}

        # Return email with partial masking for security
        email = user.email
        if "@" in email:
            local, domain = email.split("@", 1)
            masked_local = local[:2] + "***" if len(local) > 2 else local[0] + "***"
            masked_email = f"{masked_local}@{domain}"
        else:
            masked_email = email

        return {"email": email, "masked_email": masked_email, "message": "Email found"}
    except Exception as e:
        return {"masked_email": None, "message": "No account found with this username"}

@router.post("/update-password")
async def update_password(
    password_data: PasswordReset,
    authorization: str = Header(...)
):
    try:
        auth_client = get_auth_client()
        access_token = authorization.replace("Bearer ", "").strip()
        
        # We need to set the session for this local client instance so update_user works
        user_response = auth_client.auth.get_user(access_token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # update_user requires an active session
        auth_client.auth.set_session(access_token, "") # Set token for this specific client
        
        result = auth_client.auth.update_user(
            {"password": password_data.new_password}
        )
        if not result.user:
            raise HTTPException(status_code=400, detail="Failed to update password")
        return {"message": "Password successfully updated"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(data: RefreshRequest):
    try:
        auth_client = get_auth_client()
        result = auth_client.auth.refresh_session(data.refresh_token)
        if not result.session:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        return RefreshResponse(
            access_token=result.session.access_token,
            refresh_token=result.session.refresh_token,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token refresh failed")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(token: Annotated[str, Depends(_oauth2_scheme)]):
    try:
        auth_client = get_auth_client()
        auth_client.auth.set_session(token, "")
        auth_client.auth.sign_out()
    except Exception:
        pass


@router.post("/resend-confirmation")
async def resend_confirmation(data: ResetConfirmation):
    try:
        auth_client = get_auth_client()
        auth_client.auth.resend({
            "type": "signup",
            "email": data.email,
            "options": {
                "email_redirect_to": "anglesapp://auth/callback"
            }
        })
        return {"message": "Confirmation email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
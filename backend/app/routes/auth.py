from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.user import User, UserProfile
from app.schemas.user import (
    UserRegister,
    UserLogin,
    Token,
    PasswordReset,
    PasswordResetRequest,
    ResetConfirmation,
    OnboardingData,
    UserwithProfile
)
from app.dependencies import AsyncSessionDep, CurrentUser
from app.core.supabase_client import supabase, supabase_admin
from uuid import UUID


router = APIRouter(prefix="/auth", tags=["auth"]) #all routes start with /auth; in API they are grouped under auth


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
        user_data: UserRegister,
        db: AsyncSessionDep
):
    try:
        # create user in supabase auth
        auth_response = supabase.auth.sign_up({
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
        )
        db.add(new_profile)

        await db.commit()
        await db.refresh(new_user)
        return {"message": "Registration successful. Please check your email to confirm your account."}

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Registration Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/onboarding", response_model=UserwithProfile)
async def complete_onboarding(
        onboarding_data: OnboardingData,
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    """
    Complete user onboarding after registration.
    Requires authentication (user must have registered first).
    """
    try:
        # Get or create profile FIRST
        result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == current_user.id)
        )
        profile = result.scalars().first()

        if not profile:
            profile = UserProfile(user_id=current_user.id)
            db.add(profile)

        # checking if username is already taken
        result = await db.execute(
            select(UserProfile).where(
                UserProfile.user_name == onboarding_data.username,
                UserProfile.user_id != current_user.id
            )
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )

        # Update profile fields (including username)
        profile.user_name = onboarding_data.username
        if onboarding_data.full_name:
            profile.full_name = onboarding_data.full_name
        if onboarding_data.gym_level:
            profile.gym_level = onboarding_data.gym_level
        if onboarding_data.avatar_url:
            profile.avatar_url = onboarding_data.avatar_url

        await db.commit()
        await db.refresh(profile)

        # return user with profile
        result = await db.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == current_user.id)
        )
        user = result.scalars().first()

        return user

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Onboarding Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Onboarding failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSessionDep):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })

        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        result = await db.execute(
            select(UserProfile).join(User).where(User.id == credentials.email)
        )
        profile = result.scalars().first()
        is_onboarded = profile is not None and profile.user_name is not None

        return Token(
            access_token=auth_response.session.access_token,
            token_type="bearer",
            is_onboarded=is_onboarded
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/request-password-reset")
async def request_password_reset(data: PasswordResetRequest):
    try:
        supabase.auth.reset_password_for_email(
            email= data.email,
            options={
                "redirect_to": "gym_app://reset-password"
            }
        )
        return {"message": "If the email exists, a reset link will be sent."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/update-password")
async def update_password(
    password_data: PasswordReset,
    authorization: str = Header(...)
):
    try:
        access_token = authorization.replace("Bearer ", "").strip()
        supabase.auth.set_session(access_token, refresh_token=None)
        supabase.auth.update_user({"password": password_data.new_password})
        return {"message": "Password successfully updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/resend-confirmation")
async def resend_confirmation(data: ResetConfirmation):
    try:
        supabase.auth.resend({
            "type": "signup",
            "email": data.email,
            "options": {
                "email_redirect_to": "gym_app://resend-confirmation"
            }
        })
        return {"message": "Confirmation email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
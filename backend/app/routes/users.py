from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user, AsyncSessionDep, CurrentUser
from app.models.user import User, UserProfile
from app.schemas.user import UserResponse, UserwithProfile, ProfileUpdate, ProfileResponse, PasswordUpdate, EmailUpdate
from app.core.supabase_client import supabase, supabase_admin
router = APIRouter(prefix="/users", tags=["Users"])

#(.get, .put, .post, .delete)
@router.get("/me", response_model=UserwithProfile)
async def get_my_profile(
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    #get current users profile(query)
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == current_user.id)
    )

    user = result.scalars().first()
    return user


@router.put("/me/profile", response_model=ProfileResponse)
async def update_my_profile(
        db: AsyncSessionDep,
        profile_data: ProfileUpdate,
        current_user: User = Depends(get_current_user)
):

    if profile_data.username is not None:
        result = await db.execute(
            select(User).where(User.username == profile_data.username)
        )
        if result.scalars().first():
            raise HTTPException(
                status_code=400, detail="Username already taken"
            )
        current_user.username = profile_data.username

    # Get or create profile
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        # Create profile if doesn't exist
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    # Update fields
    if profile_data.full_name is not None:
        profile.full_name = profile_data.full_name
    if profile_data.gym_name is not None:
        profile.gym_name = profile_data.gym_name
    if profile_data.gym_level is not None:
        profile.gym_level = profile_data.gym_level
    if profile_data.bio is not None:
        profile.bio = profile_data.bio
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url

    await db.commit()
    await db.refresh(profile)

    return profile


@router.get("/{username}", response_model=UserwithProfile)
async def get_user_by_username(
        username: str,
        db: AsyncSessionDep
):
    """Get any user's profile by username"""
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.username == username)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user

@router.put("/me/password")
async def update_password(
        db: AsyncSessionDep,
        password_data: PasswordUpdate,
        current_user: CurrentUser
):
    try:
        # Verify current password
        sign_in = supabase.auth.sign_in_with_password({
            "email": current_user.email,
            "password": password_data.current_password
        })

        if not sign_in.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        # Use admin client to update password,htis avoids session context issues
        supabase_admin.auth.admin.update_user_by_id(
            str(current_user.id),
            {"password": password_data.new_password}
        )

        return {"message": "Password updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

@router.post("/change-email")
async def change_email(
        email_data: EmailUpdate,
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    try:
        #update in Supabase Auth
        supabase.auth.update_user({
            "email": email_data.new_email
        })

        #update in our db
        current_user.email = email_data.new_email
        await db.commit()

        return {"message": "Email updated successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.dependencies import AsyncSessionDep, CurrentUser

from app.db import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserProfile
from app.schemas.user import UserResponse, UserwithProfile, ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserwithProfile)
async def get_my_profile(
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    #get current users profile
    result = await db.execute(
        select(User)
        .options(selectinload(User.profile))
        .where(User.id == current_user.id)
    )
    user = result.scalars().first()
    return user


@router.put("/me/profile", response_model=ProfileResponse)
async def update_my_profile(
        profile_data: ProfileUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
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
    if profile_data.name is not None:
        profile.name = profile_data.name
    if profile_data.gym_level is not None:
        profile.gym_level = profile_data.gym_level
    if profile_data.about is not None:
        profile.about = profile_data.about
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url
    if profile_data.weight is not None:
        profile.weight = profile_data.weight
    if profile_data.last_workout is not None:
        profile.last_workout = profile_data.last_workout
    if profile_data.current_workout is not None:
        profile.current_workout = profile_data.current_workout
        
    # Also update username if provided
    if profile_data.username is not None and profile_data.username != current_user.username:
        # NOTE: Ideally check if username exists first.
        current_user.username = profile_data.username

    await db.commit()
    await db.refresh(profile)

    return profile


@router.get("/{username}", response_model=UserwithProfile)
async def get_user_by_username(
        username: str,
        db: AsyncSession = Depends(get_db)
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

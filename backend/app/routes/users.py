from typing import List, Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlalchemy import select, and_

from app.dependencies import get_current_user, AsyncSessionDep, CurrentUser
from app.schemas.user import UserResponse, UserwithProfile, ProfileUpdate, ProfileResponse, PasswordUpdate, EmailUpdate
from app.core.supabase_client import get_auth_client, supabase_admin

from app.models.user import User, UserProfile, Follow
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
        current_user: CurrentUser
):
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    # Check username uniqueness only if it was changed
    if profile_data.user_name is not None and profile_data.user_name != profile.user_name:
        existing = await db.execute(
            select(UserProfile).where(UserProfile.user_name == profile_data.user_name)
        )
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Username already taken")
        profile.user_name = profile_data.user_name

    if profile_data.full_name is not None:
        profile.full_name = profile_data.full_name
    if profile_data.gym_level is not None:
        profile.gym_level = profile_data.gym_level
    if profile_data.bio is not None:
        profile.bio = profile_data.bio
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url
    if profile_data.weight is not None:
        profile.weight = profile_data.weight
    if profile_data.last_workout is not None:
        profile.last_workout = profile_data.last_workout
    if profile_data.current_workout is not None:
        profile.current_workout = profile_data.current_workout

    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/search", response_model=List[UserwithProfile])
async def search_users(
    q: str,
    db: AsyncSessionDep,
    current_user: CurrentUser,
    limit: int = 20
):
    """Search users by username. Used for social features."""
    safe_q = q.replace("%", "").replace("_", "")
    result = await db.execute(
        select(User)
        .join(UserProfile, UserProfile.user_id == User.id)
        .options(selectinload(User.profile))
        .where(UserProfile.user_name.ilike(f"%{safe_q}%"))
        .where(User.id != current_user.id)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{username}", response_model=UserwithProfile)
async def get_user_by_username(
        username: str,
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    """Get any user's profile by username"""
    result = await db.execute(
        select(User)
        .join(UserProfile, UserProfile.user_id == User.id)
        .options(selectinload(User.profile))
        .where(UserProfile.user_name == username)
    )
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if current user is following this user
    follow_result = await db.execute(
        select(Follow).where(
            and_(
                Follow.follower_id == current_user.id,
                Follow.following_id == user.id
            )
        )
    )
    is_following = follow_result.scalars().first() is not None

    # Manually set is_following on the profile
    if user.profile:
        user.profile.is_following = is_following

    return user

@router.put("/me/password")
async def update_password(
        db: AsyncSessionDep,
        password_data: PasswordUpdate,
        current_user: CurrentUser
):
    try:
        auth_client = get_auth_client()
        # Verify current password
        sign_in = auth_client.auth.sign_in_with_password({
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
        # Note: changing email requires an active session, but supabase_admin can bypass it
        supabase_admin.auth.admin.update_user_by_id(
            str(current_user.id),
            {"email": email_data.new_email}
        )

        #update in our db
        current_user.email = email_data.new_email
        await db.commit()

        return {"message": "Email updated successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


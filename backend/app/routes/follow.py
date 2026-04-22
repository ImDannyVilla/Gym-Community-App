from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import get_current_user, AsyncSessionDep, CurrentUser
from app.models.user import User, UserProfile, Follow
from app.schemas.user import FollowResponse, UserListItem
from app.core.supabase_client import supabase, supabase_admin

router = APIRouter(prefix="/users", tags=["follow"])


@router.post("/{user_id}/follow", response_model=FollowResponse, status_code=status.HTTP_201_CREATED)
async def follow_user(
        user_id: UUID,
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    """Create a follow relationship"""
    # Can't follow yourself
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself"
        )

    # Check if target user exists
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if already following
    existing_follow = await db.execute(
        select(Follow).where(
            and_(
                Follow.follower_id == current_user.id,
                Follow.following_id == user_id
            )
        )
    )
    if existing_follow.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already following this user"
        )

    # Create follow relationship
    new_follow = Follow(
        follower_id=current_user.id,
        following_id=user_id
    )
    db.add(new_follow)

    # Update follower/following counts
    current_user_profile = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    current_user_profile = current_user_profile.scalars().first()
    if current_user_profile:
        current_user_profile.following_count += 1

    target_user_profile = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    target_user_profile = target_user_profile.scalars().first()
    if target_user_profile:
        target_user_profile.followers_count += 1

    await db.commit()
    await db.refresh(target_user_profile)

    return FollowResponse(
        is_following=True,
        followers_count=target_user_profile.followers_count if target_user_profile else 1,
        following_count=target_user_profile.following_count if target_user_profile else 0
    )


@router.delete("/{user_id}/unfollow", response_model=FollowResponse, status_code=status.HTTP_200_OK)
async def unfollow_user(
        user_id: UUID,
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    """Delete a follow relationship"""
    # Check if follow relationship exists
    result = await db.execute(
        select(Follow).where(
            and_(
                Follow.follower_id == current_user.id,
                Follow.following_id == user_id
            )
        )
    )
    follow = result.scalars().first()

    if not follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not following this user"
        )

    # Delete follow relationship
    await db.execute(
        delete(Follow).where(
            and_(
                Follow.follower_id == current_user.id,
                Follow.following_id == user_id
            )
        )
    )

    # Update follower/following counts
    current_user_profile = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    current_user_profile = current_user_profile.scalars().first()
    if current_user_profile and current_user_profile.following_count > 0:
        current_user_profile.following_count -= 1

    target_user_profile = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    target_user_profile = target_user_profile.scalars().first()
    if target_user_profile and target_user_profile.followers_count > 0:
        target_user_profile.followers_count -= 1

    await db.commit()
    await db.refresh(target_user_profile)

    return FollowResponse(
        is_following=False,
        followers_count=target_user_profile.followers_count if target_user_profile else 0,
        following_count=target_user_profile.following_count if target_user_profile else 0
    )


@router.get("/{user_id}/followers", response_model=List[UserListItem])
async def get_followers(
        user_id: UUID,
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    """List all followers of a user"""
    # Check if user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get all followers with their profiles
    result = await db.execute(
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.following_id == user_id)
        .options(selectinload(User.profile))
    )
    followers = result.scalars().all()

    # Get current user's following list to check is_following status
    following_ids_result = await db.execute(
        select(Follow.following_id).where(Follow.follower_id == current_user.id)
    )
    following_ids = set(following_ids_result.scalars().all())

    # Build response
    return [
        UserListItem(
            id=follower.id,
            user_name=follower.profile.user_name if follower.profile else None,
            full_name=follower.profile.full_name if follower.profile else None,
            avatar_url=follower.profile.avatar_url if follower.profile else None,
            bio=follower.profile.bio if follower.profile else None,
            followers_count=follower.profile.followers_count if follower.profile else 0,
            is_following=follower.id in following_ids
        )
        for follower in followers
    ]


@router.get("/{user_id}/following", response_model=List[UserListItem])
async def get_following(
        user_id: UUID,
        db: AsyncSessionDep,
        current_user: CurrentUser
):
    """List all users that a user is following"""
    # Check if user exists
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get all following with their profiles
    result = await db.execute(
        select(User)
        .join(Follow, Follow.following_id == User.id)
        .where(Follow.follower_id == user_id)
        .options(selectinload(User.profile))
    )
    following = result.scalars().all()

    # Get current user's following list to check is_following status
    following_ids_result = await db.execute(
        select(Follow.following_id).where(Follow.follower_id == current_user.id)
    )
    following_ids = set(following_ids_result.scalars().all())

    # Build response
    return [
        UserListItem(
            id=followed_user.id,
            user_name=followed_user.profile.user_name if followed_user.profile else None,
            full_name=followed_user.profile.full_name if followed_user.profile else None,
            avatar_url=followed_user.profile.avatar_url if followed_user.profile else None,
            bio=followed_user.profile.bio if followed_user.profile else None,
            followers_count=followed_user.profile.followers_count if followed_user.profile else 0,
            is_following=followed_user.id in following_ids
        )
        for followed_user in following
    ]

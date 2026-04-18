import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
AsyncSession, async_sessionmaker, create_async_engine
)
from typing import AsyncGenerator

from app.db import Base, get_db
from app.main import gym_app
from app.models.user import User, UserProfile, Follow
from uuid import uuid4
from app.core.supabase_client import supabase_admin, supabase
# Using SQlite in-memory for fast testing
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """This is Database test engine creation"""
    engine = create_async_engine(TEST_DB_URL, echo=True) # turn echo off after test are stable
    #Create the tables here
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine # All test runs while this fixture sits at the yield, keeping db alive
    #Drop the tables here

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """This is Database test session creation"""
    async_session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session_maker() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(test_session) -> User:
    """Create test user in both Supabase and local DB"""
    # Create user in Supabase Auth
    test_email = f"test-{uuid4()}@example.com"
    auth_response = supabase_admin.auth.admin.create_user({
        "email": test_email,
        "password": "Password123$",
        "email_confirm": True
    })

    user = User(
        id=auth_response.user.id,
        email=test_email,
        username="testuser"
    )
    test_session.add(user)
    await test_session.flush()

    profile = UserProfile(
        user_id=user.id,
        full_name="Test User"
    )
    test_session.add(profile)
    await test_session.commit()
    await test_session.refresh(user)

    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict[str, str]:
    """Get real Supabase auth token"""
    # Sign in to get real token
    auth_response = supabase.auth.sign_in_with_password({
        "email": test_user.email,
        "password": "Password123$"
    })

    return {"Authorization": f"Bearer {auth_response.session.access_token}"}
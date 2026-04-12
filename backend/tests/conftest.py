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
from app.models.workout import Workout
from app.models.exercise import Exercise
from app.core.security import get_password_hash, create_access_token

# Using SQlite in-memory for fast testing
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture(scope="session")
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
async def test_client(test_session) -> AsyncGenerator[AsyncClient, None]:
    """This is HTTP client test fixture"""

    async def override_get_db():
        yield test_session

    gym_app.dependency_overrides[get_db] = override_get_db

    async with (AsyncClient(
            transport=ASGITransport(app=gym_app),
            base_url="http://test")
    as client):
        yield client

    gym_app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def test_user(test_session) -> User:
    """This is test user fixture"""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("Password123$")
)
    test_session.add(user)
    await test_session.flush() #giving the user an id to save in the test db

    # Create a profile for the user
    profile = UserProfile(
        user_id=user.id,
        gym_name="Test Gym"
    )
    test_session.add(profile)
    await test_session.commit() # seals the changes perm to the db before the fixture returns and ends the current transaction
    await test_session.refresh(user) # Make sure the user object you return to the test is up-to-date and ready to use.

    return user

@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict[str, str]:
    """This is test user authentication headers fixture"""
    access_token = create_access_token(data={"sub": test_user.email})
    return {"Authorization": f"Bearer {access_token}"}
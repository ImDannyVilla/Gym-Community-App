import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from app.main import gym_app


@pytest_asyncio.fixture
async def client(test_session, auth_headers):
    """Test client with auth and DB override"""
    from app.db import get_db
    async def override_get_db():
        yield test_session
    gym_app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=gym_app),
        base_url="http://test"
    ) as c:
        c.headers.update(auth_headers)
        yield c

    gym_app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_streak_calculation_single_workout(client):
    """Test that completing a single workout sets streak to 1."""
    # Start a workout
    log_response = await client.post("/workout-logs/", json={
        "name": "Test Workout",
        "is_public": False
    })
    assert log_response.status_code == 201
    log_id = log_response.json()["id"]
    
    # Complete the workout
    complete_response = await client.put(f"/workout-logs/{log_id}", json={
        "completed_at": datetime.now(timezone.utc).isoformat()
    })
    assert complete_response.status_code == 200
    
    # Check user profile
    profile_response = await client.get("/users/me")
    assert profile_response.status_code == 200
    profile_data = profile_response.json()
    
    assert profile_data["profile"]["day_streak"] == 1
    assert profile_data["profile"]["total_workouts"] == 1


@pytest.mark.asyncio
async def test_streak_calculation_consecutive_days(client):
    """Test that workouts on consecutive days increase the streak."""
    today = datetime.now(timezone.utc)
    yesterday = today - timedelta(days=1)
    
    # Create and complete workout from yesterday
    log1_response = await client.post("/workout-logs/", json={
        "name": "Yesterday Workout",
        "is_public": False
    })
    log1_id = log1_response.json()["id"]
    
    await client.put(f"/workout-logs/{log1_id}", json={
        "completed_at": yesterday.isoformat()
    })
    
    # Create and complete workout from today
    log2_response = await client.post("/workout-logs/", json={
        "name": "Today Workout",
        "is_public": False
    })
    log2_id = log2_response.json()["id"]
    
    await client.put(f"/workout-logs/{log2_id}", json={
        "completed_at": today.isoformat()
    })
    
    # Check user profile
    profile_response = await client.get("/users/me")
    profile_data = profile_response.json()
    
    assert profile_data["profile"]["day_streak"] == 2
    assert profile_data["profile"]["total_workouts"] == 2


@pytest.mark.asyncio
async def test_streak_broken_by_gap(client):
    """Test that a gap in workouts breaks the streak."""
    today = datetime.now(timezone.utc)
    three_days_ago = today - timedelta(days=3)
    
    # Create and complete workout from 3 days ago
    log1_response = await client.post("/workout-logs/", json={
        "name": "Old Workout",
        "is_public": False
    })
    log1_id = log1_response.json()["id"]
    
    await client.put(f"/workout-logs/{log1_id}", json={
        "completed_at": three_days_ago.isoformat()
    })
    
    # Create and complete workout from today
    log2_response = await client.post("/workout-logs/", json={
        "name": "Today Workout",
        "is_public": False
    })
    log2_id = log2_response.json()["id"]
    
    await client.put(f"/workout-logs/{log2_id}", json={
        "completed_at": today.isoformat()
    })
    
    # Check user profile - streak should be 1 (only today), not 2
    profile_response = await client.get("/users/me")
    profile_data = profile_response.json()
    
    assert profile_data["profile"]["day_streak"] == 1
    assert profile_data["profile"]["total_workouts"] == 2


@pytest.mark.asyncio
async def test_multiple_workouts_same_day(client):
    """Test that multiple workouts on the same day count as one streak day."""
    today = datetime.now(timezone.utc)
    
    # Create and complete first workout today
    log1_response = await client.post("/workout-logs/", json={
        "name": "Morning Workout",
        "is_public": False
    })
    log1_id = log1_response.json()["id"]
    
    await client.put(f"/workout-logs/{log1_id}", json={
        "completed_at": today.isoformat()
    })
    
    # Create and complete second workout today
    log2_response = await client.post("/workout-logs/", json={
        "name": "Evening Workout",
        "is_public": False
    })
    log2_id = log2_response.json()["id"]
    
    await client.put(f"/workout-logs/{log2_id}", json={
        "completed_at": (today + timedelta(hours=6)).isoformat()
    })
    
    # Check user profile - streak should be 1, total workouts should be 2
    profile_response = await client.get("/users/me")
    profile_data = profile_response.json()
    
    assert profile_data["profile"]["day_streak"] == 1
    assert profile_data["profile"]["total_workouts"] == 2

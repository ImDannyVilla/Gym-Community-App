import pytest
import pytest_asyncio
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
async def test_start_workout(client):
    response = await client.post("/workout-logs/", json={
        "name": "Push Day Session",
        "is_public": False
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Push Day Session"
    assert data["is_public"] == False
    assert "id" in data
    return data["id"]


@pytest.mark.asyncio
async def test_get_my_workout_logs(client):
    # Create one first
    await client.post("/workout-logs/", json={"name": "Test Session", "is_public": False})

    response = await client.get("/workout-logs/me")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_add_exercise_to_log(client):
    # Create log first
    log_response = await client.post("/workout-logs/", json={
        "name": "Chest Day",
        "is_public": False
    })
    log_id = log_response.json()["id"]

    response = await client.post(f"/workout-logs/{log_id}/exercises", json={
        "exercise_id": "Barbell_Bench_Press_-_Medium_Grip",
        "name": "Barbell Bench Press - Medium Grip",
        "category": "strength",
        "target": "chest",
        "equipment": "barbell",
        "order": 1,
        "sets": [
            {"set_number": 1, "reps": 8, "weight_lbs": 135.0, "completed": True},
            {"set_number": 2, "reps": 8, "weight_lbs": 135.0, "completed": True},
            {"set_number": 3, "reps": 6, "weight_lbs": 145.0, "completed": True},
        ]
    })
    assert response.status_code == 201
    data = response.json()
    assert len(data["exercises"]) == 1
    assert len(data["exercises"][0]["sets"]) == 3

@pytest.mark.asyncio
async def test_complete_workout(client):
    log_response = await client.post("/workout-logs/", json={
        "name": "Back Day",
        "is_public": False
    })
    log_id = log_response.json()["id"]

    response = await client.put(f"/workout-logs/{log_id}", json={
        "completed_at": "2026-04-19T10:00:00Z",
        "duration": 3600,
        "is_public": True,
        "caption": "Crushed back day 💪 PRd on deadlifts",
        "media_url": "https://yfkuflkzhegvctsoheju.supabase.co/storage/v1/object/public/workout-media/test.jpg",
        "media_type": "photo"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_public"] == True
    assert data["duration"] == 3600
    assert data["caption"] == "Crushed back day 💪 PRd on deadlifts"
    assert data["media_url"] is not None
    assert data["media_type"] == "photo"

@pytest.mark.asyncio
async def test_workout_with_video(client):
    log_response = await client.post("/workout-logs/", json={
        "name": "Leg Day",
        "is_public": False
    })
    log_id = log_response.json()["id"]

    response = await client.put(f"/workout-logs/{log_id}", json={
        "is_public": True,
        "caption": "New squat PR today!",
        "media_url": "https://yfkuflkzhegvctsoheju.supabase.co/storage/v1/object/public/workout-media/test.mp4",
        "media_type": "video"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["media_type"] == "video"
    assert data["caption"] == "New squat PR today!"

@pytest.mark.asyncio
async def test_delete_workout_log(client):
    log_response = await client.post("/workout-logs/", json={
        "name": "Delete Me",
        "is_public": False
    })
    log_id = log_response.json()["id"]

    response = await client.delete(f"/workout-logs/{log_id}")
    assert response.status_code == 204
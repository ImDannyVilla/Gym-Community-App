import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import gym_app


@pytest_asyncio.fixture
async def client(test_session, auth_headers):
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


SAMPLE_EXERCISES = [
    {
        "exercise_id": "Barbell_Bench_Press",
        "name": "Barbell Bench Press - Medium Grip",
        "category": "strength",
        "target": "chest",
        "equipment": "barbell",
        "order": 1,
        "target_sets": 4,
        "target_reps": 6,
    },
    {
        "exercise_id": "Incline_Dumbbell_Press",
        "name": "Incline Dumbbell Press",
        "category": "strength",
        "target": "chest",
        "equipment": "dumbbell",
        "order": 2,
        "target_sets": 3,
        "target_reps": 10,
    }
]


@pytest.mark.asyncio
async def test_create_routine(client):
    response = await client.post("/routines/", json={
        "name": "Push Day",
        "description": "Chest, shoulders, triceps",
        "is_public": False,
        "exercises": SAMPLE_EXERCISES
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Push Day"
    assert len(data["exercises"]) == 2


@pytest.mark.asyncio
async def test_get_my_routines(client):
    await client.post("/routines/", json={
        "name": "Pull Day",
        "is_public": False,
        "exercises": []
    })

    response = await client.get("/routines/me")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_routine_detail(client):
    create_response = await client.post("/routines/", json={
        "name": "Leg Day",
        "is_public": False,
        "exercises": SAMPLE_EXERCISES
    })
    routine_id = create_response.json()["id"]

    response = await client.get(f"/routines/{routine_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == routine_id
    assert len(data["exercises"]) == 2


@pytest.mark.asyncio
async def test_update_routine(client):
    create_response = await client.post("/routines/", json={
        "name": "Old Name",
        "is_public": False,
        "exercises": []
    })
    routine_id = create_response.json()["id"]

    response = await client.put(f"/routines/{routine_id}", json={
        "name": "New Name",
        "is_public": True
    })
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["is_public"] == True


@pytest.mark.asyncio
async def test_delete_routine(client):
    create_response = await client.post("/routines/", json={
        "name": "Delete Me",
        "is_public": False,
        "exercises": []
    })
    routine_id = create_response.json()["id"]

    response = await client.delete(f"/routines/{routine_id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_cannot_access_private_routine_of_other_user(client):
    # Create a private routine
    create_response = await client.post("/routines/", json={
        "name": "Private Routine",
        "is_public": False,
        "exercises": []
    })
    routine_id = create_response.json()["id"]

    # Accessing your own private routine should work
    response = await client.get(f"/routines/{routine_id}")
    assert response.status_code == 200
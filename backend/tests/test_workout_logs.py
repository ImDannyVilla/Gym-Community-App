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


@pytest.mark.asyncio
async def test_public_feed(client):
    # Create a completed public log
    log_response = await client.post("/workout-logs/", json={"name": "Public Workout", "is_public": False})
    log_id = log_response.json()["id"]
    await client.put(f"/workout-logs/{log_id}", json={
        "completed_at": "2026-04-20T10:00:00Z",
        "duration": 1800,
        "is_public": True,
        "caption": "Great session",
    })

    # Create a completed private log
    priv_response = await client.post("/workout-logs/", json={"name": "Private Workout", "is_public": False})
    priv_id = priv_response.json()["id"]
    await client.put(f"/workout-logs/{priv_id}", json={
        "completed_at": "2026-04-20T11:00:00Z",
        "is_public": False,
    })

    # Public endpoint — no auth needed, but the test client has auth headers anyway
    response = await client.get("/workout-logs/public")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    ids = [item["id"] for item in data]
    assert log_id in ids, "Public log should appear in feed"
    assert priv_id not in ids, "Private log must not appear in feed"

    # Every item includes required fields
    for item in data:
        assert "user_id" in item
        assert "exercise_count" in item


@pytest.mark.asyncio
async def test_public_feed_pagination(client):
    for i in range(3):
        log_response = await client.post("/workout-logs/", json={"name": f"Paginate {i}", "is_public": False})
        log_id = log_response.json()["id"]
        await client.put(f"/workout-logs/{log_id}", json={
            "completed_at": f"2026-04-2{i}T10:00:00Z",
            "is_public": True,
        })

    response = await client.get("/workout-logs/public?skip=0&limit=2")
    assert response.status_code == 200
    assert len(response.json()) <= 2

    response2 = await client.get("/workout-logs/public?skip=2&limit=2")
    assert response2.status_code == 200


@pytest.mark.asyncio
async def test_get_public_workout_log_detail(client):
    """Public log returns 200 with exercises and sets."""
    log_r = await client.post("/workout-logs/", json={"name": "Public Detail", "is_public": False})
    log_id = log_r.json()["id"]

    await client.post(f"/workout-logs/{log_id}/exercises", json={
        "exercise_id": "Barbell_Bench_Press_-_Medium_Grip",
        "name": "Barbell Bench Press - Medium Grip",
        "category": "strength",
        "target": "chest",
        "equipment": "barbell",
        "order": 1,
        "sets": [
            {"set_number": 1, "reps": 10, "weight_lbs": 100.0, "completed": True},
            {"set_number": 2, "reps": 8, "weight_lbs": 110.0, "completed": True},
        ],
    })

    await client.put(f"/workout-logs/{log_id}", json={
        "completed_at": "2026-04-20T10:00:00Z",
        "is_public": True,
    })

    response = await client.get(f"/workout-logs/public/{log_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == log_id
    assert data["name"] == "Public Detail"
    assert len(data["exercises"]) == 1
    assert len(data["exercises"][0]["sets"]) == 2
    assert "user_id" in data


@pytest.mark.asyncio
async def test_get_public_workout_log_private_returns_404(client):
    """Private log returns 404 on the public endpoint."""
    log_r = await client.post("/workout-logs/", json={"name": "Private Only", "is_public": False})
    log_id = log_r.json()["id"]

    response = await client.get(f"/workout-logs/public/{log_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_public_workout_log_nonexistent_returns_404(client):
    """Non-existent log ID returns 404."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/workout-logs/public/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_streak_endpoint_includes_total_volume(client):
    """Streak endpoint returns total_volume as sum of weight_lbs * reps for completed sets."""
    log_r = await client.post("/workout-logs/", json={"name": "Volume Test", "is_public": False})
    log_id = log_r.json()["id"]

    # 3 sets: 8 @ 135 = 1080, 8 @ 135 = 1080, 6 @ 145 = 870  → total 3030
    await client.post(f"/workout-logs/{log_id}/exercises", json={
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
        ],
    })

    await client.put(f"/workout-logs/{log_id}", json={"completed_at": "2026-04-20T10:00:00Z"})

    streak_r = await client.get("/workout-logs/me/streak")
    assert streak_r.status_code == 200
    data = streak_r.json()

    assert "total_volume" in data
    assert data["total_volume"] == pytest.approx(3030.0)


@pytest.mark.asyncio
async def test_streak_endpoint_total_volume_excludes_incomplete_sets(client):
    """Sets with completed=False must not count towards total_volume."""
    log_r = await client.post("/workout-logs/", json={"name": "Partial", "is_public": False})
    log_id = log_r.json()["id"]

    await client.post(f"/workout-logs/{log_id}/exercises", json={
        "exercise_id": "Squat",
        "name": "Squat",
        "category": "strength",
        "target": "legs",
        "equipment": "barbell",
        "order": 1,
        "sets": [
            {"set_number": 1, "reps": 5, "weight_lbs": 200.0, "completed": True},
            {"set_number": 2, "reps": 5, "weight_lbs": 200.0, "completed": False},
        ],
    })

    await client.put(f"/workout-logs/{log_id}", json={"completed_at": "2026-04-20T10:00:00Z"})

    streak_r = await client.get("/workout-logs/me/streak")
    data = streak_r.json()

    # Only the first set counts: 5 * 200 = 1000
    assert data["total_volume"] == pytest.approx(1000.0)


@pytest.mark.asyncio
async def test_streak_endpoint_total_volume_zero_with_no_sets(client):
    """total_volume is 0.0 when there are no completed sets."""
    streak_r = await client.get("/workout-logs/me/streak")
    assert streak_r.status_code == 200
    assert streak_r.json()["total_volume"] == 0.0


def _finalize_payload(**overrides):
    payload = {
        "name": "Finalized",
        "is_public": False,
        "completed_at": "2026-04-20T10:00:00Z",
        "duration": 1800,
        "caption": None,
        "media_url": None,
        "media_type": None,
        "exercises": [
            {
                "exercise_id": "Barbell_Bench_Press_-_Medium_Grip",
                "name": "Bench",
                "category": "strength",
                "target": "chest",
                "equipment": "barbell",
                "order": 1,
                "sets": [
                    {"set_number": 1, "reps": 8, "weight_lbs": 135.0, "completed": True},
                    {"set_number": 2, "reps": 8, "weight_lbs": 135.0, "completed": True},
                ],
            },
            {
                "exercise_id": "Squat",
                "name": "Squat",
                "category": "strength",
                "target": "legs",
                "equipment": "barbell",
                "order": 2,
                "sets": [
                    {"set_number": 1, "reps": 5, "weight_lbs": 200.0, "completed": True},
                ],
            },
        ],
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_finalize_creates_exercises_and_sets_log_fields(client):
    log_r = await client.post("/workout-logs/", json={"name": "F1", "is_public": False})
    log_id = log_r.json()["id"]

    response = await client.post(f"/workout-logs/{log_id}/finalize", json=_finalize_payload(
        name="My Finalized Workout",
        is_public=True,
        caption="Solid session",
    ))
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Finalized Workout"
    assert data["is_public"] is True
    assert data["duration"] == 1800
    assert data["caption"] == "Solid session"
    assert len(data["exercises"]) == 2
    assert len(data["exercises"][0]["sets"]) == 2
    assert len(data["exercises"][1]["sets"]) == 1


@pytest.mark.asyncio
async def test_finalize_is_idempotent_on_retry(client):
    """Calling finalize twice produces the same final state, not duplicated rows."""
    log_r = await client.post("/workout-logs/", json={"name": "F2", "is_public": False})
    log_id = log_r.json()["id"]

    await client.post(f"/workout-logs/{log_id}/finalize", json=_finalize_payload())
    response = await client.post(f"/workout-logs/{log_id}/finalize", json=_finalize_payload())
    assert response.status_code == 200
    data = response.json()
    assert len(data["exercises"]) == 2
    total_sets = sum(len(ex["sets"]) for ex in data["exercises"])
    assert total_sets == 3


@pytest.mark.asyncio
async def test_finalize_replaces_existing_exercises(client):
    """A finalize call replaces any pre-existing exercises on the log."""
    log_r = await client.post("/workout-logs/", json={"name": "F3", "is_public": False})
    log_id = log_r.json()["id"]

    await client.post(f"/workout-logs/{log_id}/exercises", json={
        "exercise_id": "Old_Exercise",
        "name": "Old",
        "category": "strength",
        "target": "back",
        "equipment": "barbell",
        "order": 1,
        "sets": [{"set_number": 1, "reps": 5, "weight_lbs": 100.0, "completed": True}],
    })

    response = await client.post(f"/workout-logs/{log_id}/finalize", json=_finalize_payload())
    assert response.status_code == 200
    data = response.json()
    names = [ex["name"] for ex in data["exercises"]]
    assert "Old" not in names
    assert "Bench" in names
    assert "Squat" in names


@pytest.mark.asyncio
async def test_finalize_invalid_payload_preserves_existing_state(client):
    """Validation failure rejects the request without touching existing exercises."""
    log_r = await client.post("/workout-logs/", json={"name": "F4", "is_public": False})
    log_id = log_r.json()["id"]

    await client.post(f"/workout-logs/{log_id}/exercises", json={
        "exercise_id": "Existing",
        "name": "Existing",
        "category": "strength",
        "target": "chest",
        "equipment": "barbell",
        "order": 1,
        "sets": [{"set_number": 1, "reps": 5, "weight_lbs": 100.0, "completed": True}],
    })

    bad_payload = _finalize_payload()
    # Second exercise's first set has reps below the schema minimum (ge=0 → -1 fails)
    bad_payload["exercises"][1]["sets"][0]["reps"] = -1

    response = await client.post(f"/workout-logs/{log_id}/finalize", json=bad_payload)
    assert response.status_code == 422

    # Pre-existing exercises must still be there — no partial state.
    detail = await client.get(f"/workout-logs/{log_id}")
    assert detail.status_code == 200
    existing = detail.json()["exercises"]
    assert len(existing) == 1
    assert existing[0]["name"] == "Existing"


@pytest.mark.asyncio
async def test_finalize_404_when_log_belongs_to_another_user(client):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.post(f"/workout-logs/{fake_id}/finalize", json=_finalize_payload())
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_finalize_recomputes_streak(client):
    """Finalize updates the streak in the same commit."""
    log_r = await client.post("/workout-logs/", json={"name": "F5", "is_public": False})
    log_id = log_r.json()["id"]

    today_iso = "2026-04-20T10:00:00Z"
    await client.post(f"/workout-logs/{log_id}/finalize", json=_finalize_payload(
        completed_at=today_iso,
    ))

    streak_r = await client.get("/workout-logs/me/streak")
    assert streak_r.status_code == 200
    data = streak_r.json()
    assert data["total_workouts"] >= 1
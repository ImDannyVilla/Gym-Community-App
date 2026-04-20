import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone

from app.main import gym_app
from app.models.workout_log import WorkoutLog, WorkoutLogExercise, WorkoutLogSet
from app.db import get_db


@pytest_asyncio.fixture
async def client(test_session, auth_headers, test_user):
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


@pytest_asyncio.fixture
async def seeded_exercise_history(test_session, test_user):
    """Create a workout log with a bench press exercise directly in DB."""
    log = WorkoutLog(
        id=uuid4(),
        user_id=test_user.id,
        name="Push Day",
        is_public=False,
        started_at=datetime.now(timezone.utc),
    )
    test_session.add(log)
    await test_session.flush()

    exercise = WorkoutLogExercise(
        id=uuid4(),
        workout_log_id=log.id,
        exercise_id="Barbell_Bench_Press",
        name="Barbell Bench Press - Medium Grip",
        category="strength",
        target="chest",
        equipment="barbell",
        order=1,
    )
    test_session.add(exercise)
    await test_session.flush()

    sets = [
        WorkoutLogSet(id=uuid4(), workout_log_exercise_id=exercise.id, set_number=1, reps=8, weight_lbs=135.0, completed=True),
        WorkoutLogSet(id=uuid4(), workout_log_exercise_id=exercise.id, set_number=2, reps=8, weight_lbs=135.0, completed=True),
        WorkoutLogSet(id=uuid4(), workout_log_exercise_id=exercise.id, set_number=3, reps=6, weight_lbs=145.0, completed=True),
    ]
    for s in sets:
        test_session.add(s)

    await test_session.commit()
    return {"exercise_id": "Barbell_Bench_Press", "log_id": str(log.id)}


@pytest.mark.asyncio
async def test_get_exercise_history(client, seeded_exercise_history):
    exercise_id = seeded_exercise_history["exercise_id"]
    response = await client.get(f"/exercises/{exercise_id}/history")

    assert response.status_code == 200
    data = response.json()
    assert data["exercise_id"] == exercise_id
    assert data["name"] == "Barbell Bench Press - Medium Grip"
    assert len(data["sets"]) == 3
    assert data["sets"][0]["reps"] == 8
    assert data["sets"][0]["weight_lbs"] == 135.0
    assert data["sets"][2]["weight_lbs"] == 145.0
    assert "last_performed" in data


@pytest.mark.asyncio
async def test_exercise_history_not_found(client):
    """Exercise that user has never done should return 404."""
    response = await client.get("/exercises/exercise_never_done_xyz/history")
    assert response.status_code == 404
    assert "No previous performance found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_most_recent_session_returned(client, test_session, test_user):
    """When user has done exercise multiple times, most recent is returned."""
    # First session - older
    log1 = WorkoutLog(
        id=uuid4(),
        user_id=test_user.id,
        name="Old Push Day",
        is_public=False,
        started_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )
    test_session.add(log1)
    await test_session.flush()

    ex1 = WorkoutLogExercise(
        id=uuid4(),
        workout_log_id=log1.id,
        exercise_id="Barbell_Bench_Press",
        name="Barbell Bench Press - Medium Grip",
        category="strength",
        target="chest",
        equipment="barbell",
        order=1,
    )
    test_session.add(ex1)
    await test_session.flush()
    test_session.add(WorkoutLogSet(
        id=uuid4(), workout_log_exercise_id=ex1.id,
        set_number=1, reps=6, weight_lbs=115.0, completed=True
    ))

    # Second session - newer
    log2 = WorkoutLog(
        id=uuid4(),
        user_id=test_user.id,
        name="Recent Push Day",
        is_public=False,
        started_at=datetime(2026, 4, 19, tzinfo=timezone.utc),
    )
    test_session.add(log2)
    await test_session.flush()

    ex2 = WorkoutLogExercise(
        id=uuid4(),
        workout_log_id=log2.id,
        exercise_id="Barbell_Bench_Press",
        name="Barbell Bench Press - Medium Grip",
        category="strength",
        target="chest",
        equipment="barbell",
        order=1,
    )
    test_session.add(ex2)
    await test_session.flush()
    test_session.add(WorkoutLogSet(
        id=uuid4(), workout_log_exercise_id=ex2.id,
        set_number=1, reps=8, weight_lbs=155.0, completed=True
    ))

    await test_session.commit()

    response = await client.get("/exercises/Barbell_Bench_Press/history")
    assert response.status_code == 200
    data = response.json()
    # Should return the most recent session (155lbs not 115lbs)
    assert data["sets"][0]["weight_lbs"] == 155.0
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from uuid import uuid4
from datetime import datetime, timezone

from app.main import gym_app
from app.db import get_db
from app.models.workout_log import WorkoutLog, WorkoutLogExercise, WorkoutLogSet


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
async def completed_log(test_session, test_user):
    """Create a completed workout log with exercises and sets."""
    log = WorkoutLog(
        id=uuid4(),
        user_id=test_user.id,
        name="Push Day",
        is_public=False,
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        duration=3600,
    )
    test_session.add(log)
    await test_session.flush()

    ex1 = WorkoutLogExercise(
        id=uuid4(),
        workout_log_id=log.id,
        exercise_id="Barbell_Bench_Press",
        name="Barbell Bench Press - Medium Grip",
        category="strength",
        target="chest",
        equipment="barbell",
        order=1,
    )
    test_session.add(ex1)
    await test_session.flush()

    for i, (reps, weight) in enumerate([(8, 135), (8, 135), (6, 145)], start=1):
        test_session.add(WorkoutLogSet(
            id=uuid4(),
            workout_log_exercise_id=ex1.id,
            set_number=i,
            reps=reps,
            weight_lbs=float(weight),
            completed=True,
        ))

    ex2 = WorkoutLogExercise(
        id=uuid4(),
        workout_log_id=log.id,
        exercise_id="Incline_Dumbbell_Press",
        name="Incline Dumbbell Press",
        category="strength",
        target="chest",
        equipment="dumbbell",
        order=2,
    )
    test_session.add(ex2)
    await test_session.flush()

    for i, (reps, weight) in enumerate([(10, 60), (10, 60), (8, 65)], start=1):
        test_session.add(WorkoutLogSet(
            id=uuid4(),
            workout_log_exercise_id=ex2.id,
            set_number=i,
            reps=reps,
            weight_lbs=float(weight),
            completed=True,
        ))

    await test_session.commit()
    return log


@pytest.mark.asyncio
async def test_save_log_as_routine(client, completed_log):
    response = await client.post(f"/workout-logs/{completed_log.id}/save-as-routine")

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Push Day"
    assert len(data["exercises"]) == 2
    assert data["is_public"] == False
    assert "Saved from workout" in data["description"]


@pytest.mark.asyncio
async def test_save_log_as_routine_custom_name(client, completed_log):
    response = await client.post(
        f"/workout-logs/{completed_log.id}/save-as-routine",
        params={"name": "My Custom Push Routine"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Custom Push Routine"


@pytest.mark.asyncio
async def test_save_routine_preserves_sets_and_weights(client, completed_log):
    response = await client.post(f"/workout-logs/{completed_log.id}/save-as-routine")

    assert response.status_code == 201
    data = response.json()

    bench = next(e for e in data["exercises"] if e["exercise_id"] == "Barbell_Bench_Press")
    assert bench["target_sets"] == 3
    assert bench["target_reps"] == 6   # last set reps
    assert bench["target_weight_lbs"] == 145  # last set weight

    incline = next(e for e in data["exercises"] if e["exercise_id"] == "Incline_Dumbbell_Press")
    assert incline["target_sets"] == 3
    assert incline["target_reps"] == 8
    assert incline["target_weight_lbs"] == 65


@pytest.mark.asyncio
async def test_cannot_save_other_users_log_as_routine(client, test_session, test_user):
    """Cannot save a log that belongs to another user."""
    other_user_log = WorkoutLog(
        id=uuid4(),
        user_id=uuid4(),  # different user
        name="Someone Else's Workout",
        is_public=True,
        started_at=datetime.now(timezone.utc),
    )
    test_session.add(other_user_log)
    await test_session.commit()

    response = await client.post(f"/workout-logs/{other_user_log.id}/save-as-routine")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_save_nonexistent_log_as_routine(client):
    response = await client.post(f"/workout-logs/{uuid4()}/save-as-routine")
    assert response.status_code == 404
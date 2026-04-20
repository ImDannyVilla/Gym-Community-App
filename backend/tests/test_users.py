from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import gym_app
from app.db import get_db
from app.models.user import User, UserProfile


@pytest_asyncio.fixture
async def client(test_session, auth_headers):
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
async def test_update_password_success(client):
    response = await client.put(
        "/users/me/password",
        json={
            "current_password": "Password123$",
            "new_password": "NewPassword123!"
        }
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"


@pytest.mark.asyncio
async def test_update_password_incorrect_current(client):
    response = await client.put(
        "/users/me/password",
        json={
            "current_password": "WrongPassword123$",
            "new_password": "NewPassword123!"
        }
    )
    assert response.status_code == 400
    assert "Current password is incorrect" in response.json()["detail"]


@pytest.mark.asyncio
async def test_update_password_invalid_new(client):
    response = await client.put(
        "/users/me/password",
        json={
            "current_password": "Password123$",
            "new_password": "short"
        }
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_password_no_auth(test_session):
    """Should return 401 without auth header."""
    async def override_get_db():
        yield test_session
    gym_app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=gym_app),
        base_url="http://test"
    ) as c:
        response = await c.put(
            "/users/me/password",
            json={
                "current_password": "Password123$",
                "new_password": "NewPassword123!"
            }
        )
    gym_app.dependency_overrides.clear()
    assert response.status_code == 401



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
async def user_with_username(test_session, test_user):
    """Give test_user a username in their profile."""
    result = await test_session.execute(
        __import__('sqlalchemy').select(UserProfile).where(UserProfile.user_id == test_user.id)
    )
    profile = result.scalars().first()
    if profile:
        profile.user_name = "dannyvilla"
    else:
        profile = UserProfile(user_id=test_user.id, user_name="dannyvilla")
        test_session.add(profile)
    await test_session.commit()
    return test_user


@pytest_asyncio.fixture
async def other_user(test_session):
    """Create a second user with a username for search testing."""
    from app.core.supabase_client import supabase_admin
    email = f"other-{uuid4()}@example.com"
    auth_response = supabase_admin.auth.admin.create_user({
        "email": email,
        "password": "Password123$",
        "email_confirm": True
    })
    user = User(id=auth_response.user.id, email=email)
    test_session.add(user)
    await test_session.flush()

    profile = UserProfile(user_id=user.id, user_name="otheruser", full_name="Other User")
    test_session.add(profile)
    await test_session.commit()
    return user


# ── GET /users/{username} ─────────────────────────────

@pytest.mark.asyncio
async def test_get_user_by_username(client, user_with_username):
    response = await client.get("/users/dannyvilla")
    assert response.status_code == 200
    data = response.json()
    assert data["profile"]["user_name"] == "dannyvilla"
    assert "email" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_get_user_by_username_not_found(client):
    response = await client.get("/users/doesnotexist123")
    assert response.status_code == 404
    assert "User not found" in response.json()["detail"]


# ── GET /users/search ─────────────────────────────────

@pytest.mark.asyncio
async def test_search_users(client, user_with_username, other_user):
    response = await client.get("/users/search?q=other")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    usernames = [u["profile"]["user_name"] for u in data if u.get("profile")]
    assert "otheruser" in usernames


@pytest.mark.asyncio
async def test_search_excludes_self(client, user_with_username):
    """Search results should not include the current user."""
    response = await client.get("/users/search?q=danny")
    assert response.status_code == 200
    data = response.json()
    ids = [u["id"] for u in data]
    assert str(user_with_username.id) not in ids


@pytest.mark.asyncio
async def test_search_no_results(client):
    response = await client.get("/users/search?q=zzznomatchzzz")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_search_requires_auth(test_session):
    """Search should return 401 without auth."""
    async def override_get_db():
        yield test_session
    gym_app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=gym_app),
        base_url="http://test"
    ) as c:
        response = await c.get("/users/search?q=dan")

    gym_app.dependency_overrides.clear()
    assert response.status_code == 401
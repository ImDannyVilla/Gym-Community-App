import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import gym_app
from app.db import get_db


@pytest_asyncio.fixture
async def client(test_session):
    async def override_get_db():
        yield test_session
    gym_app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=gym_app),
        base_url="http://test"
    ) as c:
        yield c

    gym_app.dependency_overrides.clear()


# ── Password Validation ───────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("bad_password, expected_error", [
    ("short",                          "Password must be at least 8 characters"),
    ("nouppercase123!",                "Password must contain at least one uppercase letter"),
    ("ALLUPPERCASE123!",               "Password must contain at least one lowercase letter"),
    ("NoNumbersHere!",                 "Password must contain at least one digit"),
    ("NoSpecialChar123",               "Password must contain at least one special character"),
    ("Password 123!",                  "Password must not contain any spaces"),
    ("Password123456789012345678901",  "Password must be less than 20 characters long"),
    ("",                               "Password cannot be empty"),
])
async def test_password_validation(client, bad_password, expected_error):
    response = await client.post("/auth/register", json={
        "email": f"test_{bad_password[:5]}@test.com",
        "password": bad_password,
    })
    assert response.status_code == 422
    assert expected_error in response.text


# ── Register Success ──────────────────────────────────

@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/auth/register", json={
        "email": "success@test.com",
        "password": "Password123!",
    })
    assert response.status_code == 201
    data = response.json()
    assert "message" in data
    assert "check your email" in data["message"].lower()


# ── Login ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_login_success(client, test_user, auth_headers):
    response = await client.post("/auth/login", data={
        "username": test_user.email,
        "password": "Password123$",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "is_onboarded" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client, test_user):
    response = await client.post("/auth/login", data={
        "username": test_user.email,
        "password": "WrongPassword123!",
    })
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_wrong_email(client):
    response = await client.post("/auth/login", data={
        "username": "nonexistent@test.com",
        "password": "Password123!",
    })
    assert response.status_code == 401


# ── Onboarding ────────────────────────────────────────

@pytest.mark.asyncio
async def test_onboarding_success(client, auth_headers):
    client.headers.update(auth_headers)
    response = await client.post("/auth/onboarding", json={
        "user_name": "dannyvilla",
        "full_name": "Danny Villanueva",
        "gym_level": "Intermediate",
    })
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_onboarding_requires_auth(client):
    response = await client.post("/auth/onboarding", json={
        "user_name": "dannyvilla",
    })
    assert response.status_code == 401


# ── Resend Confirmation ───────────────────────────────

@pytest.mark.asyncio
async def test_resend_confirmation(client, test_user):
    response = await client.post("/auth/resend-confirmation", json={
        "email": test_user.email
    })
    assert response.status_code == 200
    assert "Confirmation email sent" in response.json()["message"]


# ── Password Reset Request ────────────────────────────

@pytest.mark.asyncio
async def test_request_password_reset(client):
    response = await client.post("/auth/request-password-reset", json={
        "email": "anyone@test.com"
    })
    assert response.status_code == 200
    assert "reset link" in response.json()["message"].lower()
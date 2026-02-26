# use PYTHONPATH="" uv run pytest to run test

import pytest
from httpx import AsyncClient, ASGITransport #AsyncClinet works entirely in memory without relying on real network ports
from app.main import gym_app


@pytest.mark.asyncio
@pytest.mark.parametrize("bad_password, expected_error", [
    ("short", "Password must be at least 8 characters"),
    ("nouppercase123!", "Password must contain at least one uppercase letter"),
    ("ALLUPPERCASE123!", "Password must contain at least one lowercase letter"),
    ("NoNumbersHere!", "Password must contain at least one digit"),
    ("NoSpecialChar123", "Password must contain at least one special character")
])
async def test_password_validation(bad_password, expected_error):
    async with AsyncClient(transport=ASGITransport(app=gym_app), base_url="http://test") as client:
        response = await client.post("/auth/register", json={
            "email": "test@test.com",
            "username": "testuser",
            "password": bad_password
        })

        assert response.status_code == 422
        assert expected_error in response.text


@pytest.mark.asyncio
async def test_username_too_short():
    async with AsyncClient(transport=ASGITransport(app=gym_app), base_url="http://test") as client:
        response = await client.post("/auth/register", json={
            "email": "test@test.com",
            "username": "te",
            "password": "password123"
        })
        assert response.status_code == 422
        assert "Username must be at least 3 characters" in response.text

@pytest.mark.asyncio
async def test_duplicate_email():
    async with AsyncClient(transport=ASGITransport(app=gym_app), base_url="https://test") as client:
        response = await client.post("/auth/register", json={
            "email": "dup@test.com",
            "username": "user1",
            "password": "Password123"
        })
    #try another with same email
    async with AsyncClient(transport=ASGITransport(app=gym_app), base_url="https://test") as client:
        response = await client.post("/auth/register", json={
            "email": "dup@test.com",
            "username": "user2",
            "password": "Password123"
        })
    assert response.status_code == 400
    assert "Email is already registered" in response.text

@pytest.mark.asyncio
async def test_duplicate_username():
    async with AsyncClient(transport=ASGITransport(app=gym_app), base_url="http://test") as client:
        response = await client.post("/auth/register", json={
            "email": "test@test.com",
            "username": "testdupe",
            "password": "Password123"
        })
        # try another with same username
        async with AsyncClient(transport=ASGITransport(app=gym_app), base_url="https://test") as client:
            response = await client.post("/auth/register", json={
                "email": "test2@test.com",
                "username": "testdupe",
                "password": "Password123"
            })

        assert response.status_code == 400
        assert "Username is already taken" in response.text
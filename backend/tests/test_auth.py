# use PYTHONPATH="" uv run pytest to run test
import pytest

from app.schemas.user import UserResponse


#test register success
#test

@pytest.mark.asyncio
@pytest.mark.parametrize("bad_password, expected_error", [
    ("short", "Password must be at least 8 characters"),
    ("nouppercase123!", "Password must contain at least one uppercase letter"),
    ("ALLUPPERCASE123!", "Password must contain at least one lowercase letter"),
    ("NoNumbersHere!", "Password must contain at least one digit"),
    ("NoSpecialChar123", "Password must contain at least one special character"),
    ("Password 123!", "Password must not contain any spaces"),
    ("Password123456789012345678901", "Password must be less than 20 characters long"),
    ("", "Password cannot be empty")
])
async def test_password_validation(test_client, bad_password, expected_error):
        response = await test_client.post("/auth/register", json={
            "email":f"test_{bad_password}@test.com",
            "username": "testuser",
            "password": bad_password,
        })

        assert response.status_code == 422
        assert expected_error in response.text

@pytest.mark.asyncio
async def test_gym_level_validation(test_client):
    response = await test_client.post("/auth/register", json={
        "email": "test@test.com",
        "username": "testuser",
        "password": "Password123!",
        "gym_level": "invalid_level"
    })
    assert response.status_code == 422
    assert "Gym level must be one of the following: Beginner, Intermediate, Advanced" in response.text

@pytest.mark.asyncio
async def test_username_too_short(test_client):
        response = await test_client.post("/auth/register", json={
            "email":"test@test.com",
            "username": "te",
            "password": "Password123!",
        })
        assert response.status_code == 422
        assert "Username must be at least 3 characters" in response.text

@pytest.mark.asyncio
async def test_duplicate_email(test_client):
        response = await test_client.post("/auth/register", json={
            "email": "dup@test.com",
            "username": "user1",
            "password": "Password123!",
        })
    #try another with same email
        response = await test_client.post("/auth/register", json={
            "email": "dup@test.com",
            "username": "user2",
            "password": "Password123!",
        })
        assert response.status_code == 400
        assert "Email already registered" in response.text

@pytest.mark.asyncio
async def test_duplicate_username(test_client):
        response = await test_client.post("/auth/register", json={
            "email": "test@test.com",
            "username": "testdupe",
            "password": "Password123!",
        })
        # try another with same username
        response = await test_client.post("/auth/register", json={
            "email": "test2@test.com",
            "username": "testdupe",
            "password": "Password123!",
        })

        assert response.status_code == 400
        assert "Username already registered" in response.text

@pytest.mark.asyncio
async def test_register_success(test_client):
        response = await test_client.post("/auth/register", json={
            "email": "success@test.com",
            "username": "successuser",
            "password": "Password123!",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "success@test.com"
        assert data["username"] == "successuser"
        assert "id" in data


import pytest
from httpx import AsyncClient
from app.models.user import User

@pytest.mark.asyncio
async def test_update_password_success(test_client: AsyncClient, test_user: User, auth_headers: dict):
    response = await test_client.put(
        "/users/me/password",
        json={
            "current_password": "Password123$",
            "new_password": "NewPassword123!"
        },
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"

@pytest.mark.asyncio
async def test_update_password_incorrect_current(test_client: AsyncClient, test_user: User, auth_headers: dict):
    response = await test_client.put(
        "/users/me/password",
        json={
            "current_password": "WrongPassword123$",
            "new_password": "NewPassword123!"
        },
        headers=auth_headers
    )
    assert response.status_code == 400
    assert "Incorrect password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_update_password_invalid_new(test_client: AsyncClient, test_user: User, auth_headers: dict):
    response = await test_client.put(
        "/users/me/password",
        json={
            "current_password": "Password123$",
            "new_password": "short"
        },
        headers=auth_headers
    )
    assert response.status_code == 422

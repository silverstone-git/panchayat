import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_signup(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_login_and_refresh(async_client: AsyncClient):
    # First signup
    await async_client.post(
        "/api/v1/auth/signup",
        json={"username": "testuser2", "email": "test2@example.com", "password": "password123"}
    )
    
    # Then login
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": "testuser2", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    
    # Test refresh
    refresh_token = data["refresh_token"]
    response = await async_client.post(
        "/api/v1/auth/refresh",
        params={"refresh_token": refresh_token}
    )
    assert response.status_code == 200
    new_data = response.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data

@pytest.mark.asyncio
async def test_get_user_by_id(async_client: AsyncClient):
    # Signup
    signup_res = await async_client.post(
        "/api/v1/auth/signup",
        json={"username": "testuser3", "email": "test3@example.com", "password": "password123"}
    )
    user_id = signup_res.json()["id"]
    
    # Fetch by ID
    response = await async_client.get(f"/api/v1/users/id/{user_id}")
    assert response.status_code == 200
    assert response.json()["username"] == "testuser3"

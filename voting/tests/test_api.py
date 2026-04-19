import pytest
from httpx import AsyncClient
from src.services.vote_service import vote_service

@pytest.mark.asyncio
async def test_health(async_client: AsyncClient):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_cast_vote(async_client: AsyncClient):
    # Mock Gateway Headers
    headers = {
        "X-User-Id": "1",
        "X-User-Name": "testuser"
    }
    
    response = await async_client.post(
        "/api/v1/votes/idea/idea-123",
        json={"direction": 1},
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_votes"] == 1
    
    # Verify Redis state
    total = await vote_service.redis.get("total_votes:idea:idea-123")
    assert int(total) == 1
    
    user_vote = await vote_service.redis.hget("user_votes:idea:idea-123", "1")
    assert int(user_vote) == 1

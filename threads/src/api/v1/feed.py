from fastapi import APIRouter, Query
from src.schemas.idea import IdeaResponse
from src.services.search_service import search_service
from src.services.cache_service import cache_service
from typing import List, Optional

router = APIRouter(prefix="/feed", tags=["Feed"])

@router.get("", response_model=List[IdeaResponse])
async def get_feed(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    sort: str = Query("new", regex="^(trending|new)$"),
    category: Optional[str] = None,
    q: Optional[str] = None
):
    # Try cache first
    cache_key = f"feed:{page}:{size}:{sort}:{category}:{q}"
    cached_data = await cache_service.get_cache(cache_key)
    if cached_data:
        return cached_data

    # Search in ES
    hits = await search_service.search_ideas(
        query_text=q,
        category=category,
        sort=sort,
        page=page,
        size=size
    )

    results = []
    for hit in hits:
        source = hit["_source"]
        source["id"] = hit["_id"]
        results.append(source)

    # Set cache
    await cache_service.set_cache(cache_key, results, expire=60)

    return results

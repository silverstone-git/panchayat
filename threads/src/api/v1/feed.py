from fastapi import APIRouter, Query
from src.schemas.idea import IdeaResponse
from src.services.search_service import search_service
from src.services.cache_service import cache_service
from src.schemas.idea import IdeaResponse, FeedResponse
...
router = APIRouter(prefix="/feed", tags=["Feed"])

@router.get("", response_model=FeedResponse)
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
        # Note: If using cache, we'd need to cache the whole object
        # For simplicity in this step, we'll bypass cache if it's not the right format
        if isinstance(cached_data, dict) and "items" in cached_data:
            return cached_data

    # Search in ES
    hits, total = await search_service.search_ideas(
        query_text=q,
        category=category,
        sort=sort,
        page=page,
        size=size
    )

    items = []
    for hit in hits:
        source = hit["_source"]
        source["id"] = hit["_id"]
        items.append(source)

    response_data = {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "has_more": (page * size) < total
    }

    # Set cache
    await cache_service.set_cache(cache_key, response_data, expire=60)

    return response_data


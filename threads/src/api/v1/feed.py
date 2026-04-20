from typing import List, Optional
from src.db.session import get_db, AsyncSession, AsyncSession
from fastapi import APIRouter, Query, Depends, Depends
from src.schemas.idea import FeedResponse
from src.services.search_service import search_service
from src.db.session import get_db, AsyncSession, AsyncSession
from src.services.cache_service import cache_service

router = APIRouter(prefix="/feed", tags=["Feed"])

@router.get("", response_model=FeedResponse)
async def get_feed(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    sort: str = Query("new", pattern="^(trending|new)$"),
    category: Optional[str] = None,
    q: Optional[str] = None,
    author_id: Optional[str] = None,
    status: Optional[str] = None
):
    # Try cache first (skip for specific author or status search)
    cache_key = f"feed:{page}:{size}:{sort}:{category}:{q}:{author_id}:{status}"
    if not author_id and not status:
        cached_data = await cache_service.get_cache(cache_key)
        if cached_data:
            if isinstance(cached_data, dict) and "items" in cached_data:
                return cached_data

    # Search in ES
    hits, total = await search_service.search_ideas(
        query_text=q,
        category=category,
        author_id=author_id,
        status=status,
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


@router.get("/stats")
async def get_category_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func, select
    from src.db.models import Idea
    
    query = select(Idea.category, func.count(Idea.id)).group_by(Idea.category)
    result = await db.execute(query)
    stats = result.all()
    
    return {category: count for category, count in stats}

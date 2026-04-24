import uuid
import boto3
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from botocore.config import Config
from src.core.config import settings
from src.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db.models import ImageRecord
from pydantic import BaseModel
from src.services.cache_service import cache_service

router = APIRouter(prefix="/images", tags=["Images"])

# ... (get_r2_client, UploadRequest, request_upload)

@router.get("/category-placeholder")
async def get_category_placeholder(category: str = Query(..., description="Category ID")):
    # Try cache first
    cache_key = f"unsplash:{category}"
    cached_url = await cache_service.get_cache(cache_key)
    if cached_url:
        return {"url": cached_url}

    # Define keywords for Unsplash search
    keywords = {
        'environment': 'nature,forest',
        'governance': 'government,parliament',
        'infrastructure': 'bridge,architecture',
        'policy': 'document,legal',
        'general': 'community,meeting'
    }
    query = keywords.get(category, 'city')
    
    import logging
    logger = logging.getLogger("threads")
    
    # If no Unsplash key is configured, fallback
    if not settings.UNSPLASH_APP_ACCESS_KEY:
        logger.warning("UNSPLASH_APP_ACCESS_KEY is not set in settings")
        fallback_url = f"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800" # Static fallback
        return {"url": fallback_url}

    try:
        async with httpx.AsyncClient() as client:
            logger.info(f"Fetching Unsplash image for query: {query}")
            # According to TODO.md: https://api.unsplash.com/search/photos?page=1&query=infrastructure,roads&client_id=ACCESS_KEY
            response = await client.get(
                "https://api.unsplash.com/search/photos",
                params={
                    "page": 1,
                    "per_page": 1,
                    "query": query,
                    "client_id": settings.UNSPLASH_APP_ACCESS_KEY
                }
            )
            if response.status_code != 200:
                logger.error(f"Unsplash API error: {response.status_code} - {response.text}")
                return {"url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"}

            data = response.json()
            
            if data.get("results") and len(data["results"]) > 0:
                # Use regular sized image for placeholders
                image_url = data["results"][0]["urls"]["regular"]
                # Cache for 24 hours
                await cache_service.set_cache(cache_key, image_url, expire=86400)
                return {"url": image_url}
            else:
                return {"url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"}
                
    except Exception as e:
        import logging
        logging.getLogger("threads").error(f"Error fetching from Unsplash: {str(e)}")
        # Fallback to a safe static image on error
        return {"url": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"}

def get_r2_client():
    if not all([settings.R2_ACCOUNT_ID, settings.R2_ACCESS_KEY_ID_PANCHAYAT_PUBLIC, settings.R2_SECRET_ACCESS_KEY_PANCHAYAT_PUBLIC]):
        raise HTTPException(status_code=500, detail="R2 Public Storage is not configured")
    
    return boto3.client(
        's3',
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID_PANCHAYAT_PUBLIC,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY_PANCHAYAT_PUBLIC,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

class UploadRequest(BaseModel):
    filename: str
    content_type: str
    file_hash: str

@router.post("/upload-request")
async def request_upload(
    request: UploadRequest,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Check if the hash already exists in the database
        stmt = select(ImageRecord).where(ImageRecord.file_hash == request.file_hash).limit(1)
        result = await db.execute(stmt)
        existing_image = result.scalar_one_or_none()

        if existing_image:
            return {
                "exists": True,
                "url": existing_image.public_url,
                "key": existing_image.file_key,
                "hash": request.file_hash
            }

        # If not, generate a presigned URL
        s3 = get_r2_client()
        extension = request.filename.split('.')[-1] if '.' in request.filename else ''
        file_key = f"idea-images/{x_user_id}_{uuid.uuid4().hex[:8]}.{extension}"
        
        presigned_url = s3.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': settings.R2_BUCKET_NAME_PUBLIC,
                'Key': file_key,
                'ContentType': request.content_type
            },
            ExpiresIn=3600 # 1 hour
        )
        
        public_url = f"{settings.R2_PUBLIC_DEVELOPMENT_URL_PANCHAYAT_PUBLIC}/{file_key}"
        if not public_url.startswith('http'):
             public_url = f"https://{public_url}"

        return {
            "exists": False,
            "upload_url": presigned_url,
            "file_key": file_key,
            "public_url": public_url,
            "hash": request.file_hash
        }
    except Exception as e:
        import logging
        logging.getLogger("threads").error(f"Error generating presigned URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

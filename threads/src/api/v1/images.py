import uuid
import boto3
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from botocore.config import Config
from src.core.config import settings
from src.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db.models import ImageRecord
from pydantic import BaseModel

router = APIRouter(prefix="/images", tags=["Images"])

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

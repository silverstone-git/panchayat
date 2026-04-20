import uuid
import boto3
from fastapi import APIRouter, Depends, HTTPException, Query
from botocore.config import Config
from src.core.config import settings
from src.api.deps import get_current_user

router = APIRouter()

def get_r2_client():
    if not all([settings.R2_ACCOUNT_ID, settings.R2_ACCESS_KEY_ID_PANCHAYAT, settings.R2_SECRET_ACCESS_KEY_PANCHAYAT]):
        raise HTTPException(status_code=500, detail="R2 Storage is not configured")
    
    return boto3.client(
        's3',
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID_PANCHAYAT,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY_PANCHAYAT,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

@router.get("/upload-url")
async def get_presigned_url(
    filename: str = Query(..., description="Original filename"),
    content_type: str = Query(..., description="MIME type of the file"),
    current_user: dict = Depends(get_current_user)
):
    try:
        s3 = get_r2_client()
        
        # Generate a unique key to prevent overwrites
        extension = filename.split('.')[-1] if '.' in filename else ''
        file_key = f"expert-docs/{current_user['id']}_{uuid.uuid4().hex[:8]}.{extension}"
        
        presigned_url = s3.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': settings.R2_BUCKET_NAME,
                'Key': file_key,
                'ContentType': content_type
            },
            ExpiresIn=3600 # 1 hour
        )
        
        # Construct public URL using the custom domain
        public_url = f"{settings.R2_S3_API_BASE_URL_PANCHAYAT}/{file_key}"
        if not public_url.startswith('http'):
             public_url = f"https://{public_url}"

        return {
            "upload_url": presigned_url,
            "file_key": file_key,
            "public_url": public_url
        }
    except Exception as e:
        import logging
        logging.getLogger("user-service").error(f"Error generating presigned URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

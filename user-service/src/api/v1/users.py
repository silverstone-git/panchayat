from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_db
from src.services.user_service import user_service
from src.schemas.user import User, UserUpdate
from src.api.deps import get_current_user
from src.db.models import User as UserModel

router = APIRouter()

@router.get("/me", response_model=User)
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=User)
async def update_me(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    return await user_service.update_user(db, current_user, user_in)

@router.get("/{username}", response_model=User)
async def get_user_profile(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/id/{user_id}", response_model=User)
async def get_user_by_id_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

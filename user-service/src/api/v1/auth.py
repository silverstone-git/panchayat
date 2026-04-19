from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_db
from src.services.user_service import user_service
from src.core.security import verify_password, create_access_token, create_refresh_token
from src.schemas.token import Token
from src.schemas.user import UserCreate, User
from src.core.config import settings
from jose import JWTError, jwt

router = APIRouter()

@router.post("/signup", response_model=User)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    # Restricted usernames check
    restricted = ["admin", "system", "panchayat", "moderator", "support", "root"]
    if user_in.username.lower() in restricted:
        raise HTTPException(status_code=400, detail="This username is reserved")

    user = await user_service.get_user_by_username(db, user_in.username)
    if user:
        raise HTTPException(status_code=400, detail="Username already registered")
    user = await user_service.get_user_by_email(db, user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return await user_service.create_user(db, user_in)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await user_service.get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.username, user_id=user.id)
    refresh_token = create_refresh_token(subject=user.username, user_id=user.id)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh_endpoint(refresh_token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("token_type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    access_token = create_access_token(subject=user.username, user_id=user.id)
    new_refresh_token = create_refresh_token(subject=user.username, user_id=user.id)
    return {"access_token": access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

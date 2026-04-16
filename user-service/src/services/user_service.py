from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db.models import User
from src.schemas.user import UserCreate, UserUpdate
from src.core.security import get_password_hash

class UserService:
    async def get_user_by_username(self, db: AsyncSession, username: str):
        result = await db.execute(select(User).where(User.username == username))
        return result.scalars().first()

    async def get_user_by_email(self, db: AsyncSession, email: str):
        result = await db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def create_user(self, db: AsyncSession, user_in: UserCreate):
        db_user = User(
            username=user_in.username,
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=get_password_hash(user_in.password),
        )
        db.add(db_user)
        await db.flush()
        await db.refresh(db_user)
        return db_user

    async def update_user(self, db: AsyncSession, db_user: User, user_in: UserUpdate):
        update_data = user_in.model_dump(exclude_unset=True)
        if "password" in update_data:
            db_user.hashed_password = get_password_hash(update_data.pop("password"))
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.add(db_user)
        await db.flush()
        await db.refresh(db_user)
        return db_user

    async def add_xp(self, db: AsyncSession, user_id: int, xp_amount: int):
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if not user:
            return None
        
        user.xp += xp_amount
        
        # Simple leveling logic: level = floor(sqrt(xp / 100)) + 1
        # Example: 0 XP = Lvl 1, 100 XP = Lvl 2, 400 XP = Lvl 3, 900 XP = Lvl 4
        import math
        new_level = math.floor(math.sqrt(user.xp / 100)) + 1
        if new_level > user.level:
            user.level = new_level
            # Could emit a LEVEL_UP event here in the future
            
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

user_service = UserService()

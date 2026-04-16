from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    profile_data: Optional[Dict[str, Any]] = None

class UserInDB(UserBase):
    id: int
    xp: int
    level: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    profile_data: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)

class User(UserInDB):
    pass

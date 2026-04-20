from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import enum

class SystemRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class ApplicationStatus(str, enum.Enum):
    PENDING_MOD = "PENDING_MOD"
    PENDING_ADMIN = "PENDING_ADMIN"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

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
    reputation: float
    authored_count: int
    votes_cast_count: int
    is_active: bool
    system_role: SystemRole
    created_at: datetime
    updated_at: Optional[datetime] = None
    profile_data: Dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)

class User(UserInDB):
    pass

class ExpertApplicationCreate(BaseModel):
    category: str
    document_urls: List[str]
    statement: Optional[str] = None

class ExpertApplicationReview(BaseModel):
    action: str = Field(..., description="Either 'APPROVE' or 'REJECT'")
    notes: Optional[str] = None

class ExpertApplicationResponse(BaseModel):
    id: int
    user_id: int
    category: str
    document_urls: List[str]
    statement: Optional[str] = None
    status: ApplicationStatus
    moderator_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

import enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, Float, ForeignKey, Enum, Text
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.sql import func

class Base(DeclarativeBase):
    pass

class SystemRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class ApplicationStatus(str, enum.Enum):
    PENDING_MOD = "PENDING_MOD"
    PENDING_ADMIN = "PENDING_ADMIN"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class UserRole(str, enum.Enum):
    EXPERT = "EXPERT"
    MODERATOR = "MODERATOR"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    reputation = Column(Float, default=5.0)
    authored_count = Column(Integer, default=0)
    votes_cast_count = Column(Integer, default=0)
    
    system_role = Column(Enum(SystemRole), default=SystemRole.USER, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Store profiles as JSON for flexibility in Phase 3
    profile_data = Column(JSON, default={})
    
    # Relationships
    roles = relationship("UserCategoryRole", back_populates="user", cascade="all, delete-orphan")
    expert_applications = relationship("ExpertApplication", back_populates="user", cascade="all, delete-orphan")

class UserCategoryRole(Base):
    __tablename__ = "user_category_roles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    category = Column(String, nullable=False, index=True) # subpanchayat
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="roles")

class ExpertApplication(Base):
    __tablename__ = "expert_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False, index=True)
    document_urls = Column(JSON, nullable=False, default=[])
    statement = Column(Text, nullable=True) # Why they want to be an expert
    
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING_MOD, nullable=False)
    moderator_notes = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", back_populates="expert_applications")

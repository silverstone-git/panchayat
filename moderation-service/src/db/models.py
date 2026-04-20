import enum
from sqlalchemy import Column, Integer, String, DateTime, Enum, Text
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func

class Base(DeclarativeBase):
    pass

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    RESOLVED_HIDDEN = "RESOLVED_HIDDEN"
    RESOLVED_IGNORED = "RESOLVED_IGNORED"

class TargetType(str, enum.Enum):
    IDEA = "idea"
    COMMENT = "comment"

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(String, nullable=False)
    target_type = Column(Enum(TargetType), nullable=False)
    target_id = Column(String, nullable=False, index=True)
    reason = Column(Text, nullable=False)
    
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING, nullable=False)
    moderator_id = Column(String, nullable=True)
    moderator_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

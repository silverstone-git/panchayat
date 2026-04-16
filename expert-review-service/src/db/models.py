import uuid
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, Float, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class Expert(Base):
    __tablename__ = "experts"

    id: Mapped[str] = mapped_column(String(255), primary_key=True) # Linked to User ID
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialty: Mapped[str] = mapped_column(String(255), nullable=False) # Category they are expert in
    bio: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ReviewAssignment(Base):
    __tablename__ = "review_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    idea_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    expert_id: Mapped[str] = mapped_column(ForeignKey("experts.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING") # PENDING, COMPLETED, EXPIRED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ExpertReview(Base):
    __tablename__ = "expert_reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("review_assignments.id"), unique=True)
    score: Mapped[float] = mapped_column(Float, nullable=False) # 0 to 10
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

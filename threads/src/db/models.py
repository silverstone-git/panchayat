import uuid
from datetime import datetime
from typing import List
from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    author_id: Mapped[str] = mapped_column(String(255), nullable=False)
    vote_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="APPROVED") # Default to APPROVED for now to avoid breaking current UI, will change to PENDING later
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    comments: Mapped[List["Comment"]] = relationship(back_populates="idea", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    idea_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ideas.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    path: Mapped[str] = mapped_column(Text, index=True, nullable=False)
    depth: Mapped[int] = mapped_column(Integer, default=0)
    vote_count: Mapped[int] = mapped_column(Integer, default=0)
    author_id: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="APPROVED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    idea: Mapped["Idea"] = relationship(back_populates="comments")

from sqlalchemy import Column, String, Integer, DateTime, UniqueConstraint
from src.db.session import Base
from datetime import datetime
import uuid

class VoteRecord(Base):
    __tablename__ = "votes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, nullable=False)
    target_id = Column(String, index=True, nullable=False)
    target_type = Column(String, nullable=False) # 'idea' or 'comment'
    direction = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'target_id', name='uq_user_target'),
    )

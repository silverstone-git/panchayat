from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import uuid
from src.db.models import Comment, Idea
from src.schemas.comment import CommentCreate
from src.services.kafka_service import kafka_service
from src.core.config import settings
from fastapi import HTTPException

class CommentService:
    async def create_comment(self, db: AsyncSession, idea_id: UUID, comment_in: CommentCreate, author_id: str):
        # 1. Verify idea exists
        idea_result = await db.execute(select(Idea).where(Idea.id == idea_id))
        idea = idea_result.scalar_one_or_none()
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")

        # 2. Setup initial values
        new_comment_id = uuid.uuid4()
        parent_id = comment_in.parent_id
        depth = 0
        path = str(new_comment_id)

        # 3. If it's a reply, inherit from parent
        if parent_id:
            parent_result = await db.execute(select(Comment).where(Comment.id == parent_id))
            parent = parent_result.scalar_one_or_none()
            if not parent:
                raise HTTPException(status_code=404, detail="Parent comment not found")
            
            if parent.idea_id != idea_id:
                raise HTTPException(status_code=400, detail="Parent comment does not belong to this idea")

            depth = parent.depth + 1
            path = f"{parent.path}/{new_comment_id}"

        # 4. Create the comment
        new_comment = Comment(
            id=new_comment_id,
            idea_id=idea_id,
            parent_id=parent_id,
            path=path,
            depth=depth,
            author_id=author_id,
            content=comment_in.content
        )
        
        db.add(new_comment)
        await db.commit()
        await db.refresh(new_comment)

        # Emit XP event
        xp_amount = 20 if not parent_id else 10
        reason = "COMMENT_CREATED" if not parent_id else "COMMENT_REPLY"
        
        await kafka_service.send_event(
            settings.KAFKA_XP_TOPIC,
            "XP_EARNED",
            {
                "user_id": int(author_id),
                "amount": xp_amount,
                "reason": reason
            }
        )

        return new_comment

    async def get_comments_for_idea(self, db: AsyncSession, idea_id: UUID, sort: str = "new"):
        # 1. Fetch all comments for the idea
        result = await db.execute(
            select(Comment)
            .where(Comment.idea_id == idea_id)
        )
        all_comments = result.scalars().all()
        
        if not all_comments:
            return []

        # 2. Build adjacency list for tree construction
        from collections import defaultdict
        children_map = defaultdict(list)
        for comment in all_comments:
            children_map[comment.parent_id].append(comment)

        # 3. Sort logic for siblings
        def sort_siblings(siblings):
            if sort == "top":
                siblings.sort(key=lambda x: x.vote_count, reverse=True)
            else: # default to "new"
                siblings.sort(key=lambda x: x.created_at, reverse=True)

        # 4. DFS to flatten the tree in the requested order
        sorted_list = []
        def traverse(parent_id):
            siblings = children_map[parent_id]
            sort_siblings(siblings)
            for child in siblings:
                sorted_list.append(child)
                traverse(child.id)

        traverse(None)
        return sorted_list

    async def update_vote_count(self, db: AsyncSession, comment_id: UUID, new_count: int):
        from sqlalchemy import update
        stmt = (
            update(Comment)
            .where(Comment.id == comment_id)
            .values(vote_count=new_count)
        )
        await db.execute(stmt)
        await db.commit()

comment_service = CommentService()

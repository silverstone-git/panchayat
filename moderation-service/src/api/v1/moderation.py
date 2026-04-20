from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from src.schemas.moderation import ModerationRequest, ModerationResult, ReportResponse, ReportAction
from src.services.moderation_service import moderation_service
from src.services.kafka_service import kafka_service
from src.db.session import get_db
from src.db.models import Report, ReportStatus

router = APIRouter()

@router.post("/check", response_model=ModerationResult)
async def check_content(request: ModerationRequest):
    return moderation_service.moderate_content(request.content)

@router.get("/reports", response_model=List[ReportResponse])
async def list_reports(
    status: Optional[ReportStatus] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Report)
    if status:
        query = query.where(Report.status == status)
    else:
        query = query.where(Report.status == ReportStatus.PENDING)
    
    query = query.order_by(Report.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/reports/{report_id}", response_model=ReportResponse)
async def take_action(
    report_id: int,
    action_in: ReportAction,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Report).where(Report.id == report_id)
    report = (await db.execute(query)).scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if action_in.action == "HIDE":
        report.status = ReportStatus.RESOLVED_HIDDEN
        # Trigger actual hiding in threads service via Kafka
        await kafka_service.hide_content(report.target_type, report.target_id)
    elif action_in.action == "IGNORE":
        report.status = ReportStatus.RESOLVED_IGNORED
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use HIDE or IGNORE.")

    report.moderator_id = x_user_id
    report.moderator_notes = action_in.notes
    report.resolved_at = datetime.now()
    
    await db.commit()
    await db.refresh(report)
    return report

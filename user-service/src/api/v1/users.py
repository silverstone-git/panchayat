from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.db.session import get_db
from src.services.user_service import user_service
from src.schemas.user import User, UserUpdate
from src.api.deps import get_current_user
from src.db.models import User as UserModel

router = APIRouter()

@router.get("/me", response_model=User)
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=User)
async def update_me(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    return await user_service.update_user(db, current_user, user_in)

@router.get("/{username}", response_model=User)
async def get_user_profile(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/id/{user_id}", response_model=User)
async def get_user_by_id_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

from typing import List
from src.schemas.user import ExpertApplicationCreate, ExpertApplicationResponse, ExpertApplicationReview, ApplicationStatus, SystemRole
from src.db.models import ExpertApplication, UserRole, UserCategoryRole
from sqlalchemy.future import select

@router.post("/expert-applications", response_model=ExpertApplicationResponse)
async def submit_expert_application(
    app_in: ExpertApplicationCreate,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if already applied and pending
    query = select(ExpertApplication).where(
        ExpertApplication.user_id == current_user.id,
        ExpertApplication.category == app_in.category,
        ExpertApplication.status.in_([ApplicationStatus.PENDING_MOD, ApplicationStatus.PENDING_ADMIN])
    )
    result = await db.execute(query)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Application already pending for this category")

    new_app = ExpertApplication(
        user_id=current_user.id,
        category=app_in.category,
        document_urls=app_in.document_urls,
        statement=app_in.statement,
        status=ApplicationStatus.PENDING_MOD
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)
    return new_app

@router.get("/expert-applications", response_model=List[ExpertApplicationResponse])
async def list_expert_applications(
    status: ApplicationStatus = None,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Only Admins and Moderators can see applications
    # For now, just let anyone see their own, or Admins/Mods see all relevant.
    # We will implement proper RBAC filtering in the next step.
    
    query = select(ExpertApplication)
    
    if current_user.system_role != SystemRole.ADMIN:
        # Check if user is a mod for any category
        mod_roles_query = select(UserCategoryRole.category).where(
            UserCategoryRole.user_id == current_user.id,
            UserCategoryRole.role == UserRole.MODERATOR
        )
        mod_cats = (await db.execute(mod_roles_query)).scalars().all()
        
        if not mod_cats:
            # Normal user can only see their own
            query = query.where(ExpertApplication.user_id == current_user.id)
        else:
            # Mods see pending mod for their categories, plus their own
            from sqlalchemy import or_, update
            query = query.where(
                or_(
                    ExpertApplication.user_id == current_user.id,
                    (ExpertApplication.category.in_(mod_cats)) & (ExpertApplication.status == ApplicationStatus.PENDING_MOD)
                )
            )
    else:
        # Admin can see everything, perhaps default to PENDING_ADMIN if no status given
        pass

    if status:
        query = query.where(ExpertApplication.status == status)

    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/expert-applications/{app_id}/review", response_model=ExpertApplicationResponse)
async def review_expert_application(
    app_id: int,
    review: ExpertApplicationReview,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch application
    query = select(ExpertApplication).where(ExpertApplication.id == app_id)
    app = (await db.execute(query)).scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    is_admin = current_user.system_role == SystemRole.ADMIN
    is_mod = False
    
    if not is_admin:
        mod_role_query = select(UserCategoryRole).where(
            UserCategoryRole.user_id == current_user.id,
            UserCategoryRole.role == UserRole.MODERATOR,
            UserCategoryRole.category == app.category
        )
        if (await db.execute(mod_role_query)).scalars().first():
            is_mod = True

    if not is_admin and not is_mod:
        raise HTTPException(status_code=403, detail="Not authorized to review this application")

    if review.action == "REJECT":
        app.status = ApplicationStatus.REJECTED
        if is_admin:
            app.admin_notes = review.notes
        else:
            app.moderator_notes = review.notes
    elif review.action == "APPROVE":
        if app.status == ApplicationStatus.PENDING_MOD and is_mod:
            app.status = ApplicationStatus.PENDING_ADMIN
            app.moderator_notes = review.notes
        elif app.status == ApplicationStatus.PENDING_ADMIN and is_admin:
            app.status = ApplicationStatus.APPROVED
            app.admin_notes = review.notes
            
            # Grant EXPERT role
            new_role = UserCategoryRole(user_id=app.user_id, role=UserRole.EXPERT, category=app.category)
            db.add(new_role)
        elif app.status == ApplicationStatus.PENDING_MOD and is_admin:
            # Admin fast-tracks
            app.status = ApplicationStatus.APPROVED
            app.admin_notes = review.notes
            new_role = UserCategoryRole(user_id=app.user_id, role=UserRole.EXPERT, category=app.category)
            db.add(new_role)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid state transition from {app.status}")
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    await db.commit()
    await db.refresh(app)
    return app

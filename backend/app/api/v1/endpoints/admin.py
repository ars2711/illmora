from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.api import deps
from app.models import sql_models as models
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# --- Admin Schemas ---
class AdminStats(BaseModel):
    total_users: int
    total_institutions: int
    total_interactions: int
    active_curricula: int
    flagged_feedback: int

class AdminFeedback(BaseModel):
    id: str
    feature: str
    sentiment: str
    content: str
    created_at: datetime
    user_email: str = "Anonymous"

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/stats", response_model=AdminStats)
def get_global_stats(
    db: Session = Depends(deps.get_db),
    # In real app: current_user: models.User = Depends(deps.get_current_active_superuser)
):
    """
    Get global platform health stats.
    """
    users = db.query(func.count(models.User.id)).scalar()
    insts = db.query(func.count(models.Institution.id)).scalar()
    chats = db.query(func.count(models.Interaction.id)).scalar()
    currs = db.query(func.count(models.Curriculum.id)).filter(models.Curriculum.is_active == True).scalar()
    flags = db.query(func.count(models.Feedback.id)).filter(models.Feedback.sentiment == "bug").scalar()
    
    return AdminStats(
        total_users=users,
        total_institutions=insts,
        total_interactions=chats,
        active_curricula=currs,
        flagged_feedback=flags or 0
    )

@router.get("/feedback/flagged", response_model=List[AdminFeedback])
def get_flagged_feedback(
    skip: int = 0, 
    limit: int = 20, 
    db: Session = Depends(deps.get_db)
):
    """
    Get bug reports or negative feedback for review.
    """
    feedbacks = db.query(models.Feedback).filter(
        models.Feedback.sentiment.in_(["bug", "confused"])
    ).order_by(models.Feedback.created_at.desc()).offset(skip).limit(limit).all()
    
    results = []
    for f in feedbacks:
        email = "Anonymous"
        if f.user:
            email = f.user.email
            
        results.append(AdminFeedback(
            id=f.id,
            feature=f.feature_context,
            sentiment=f.sentiment,
            content=f.content,
            created_at=f.created_at,
            user_email=email
        ))
        
    return results

@router.post("/seed/uat")
def seed_uat_data(db: Session = Depends(deps.get_db)):
    """
    Populates the database with Phase 3 UAT data.
    - Institution: NUST
    - Users: Admin, Student (Verified Creator)
    - Marketplace: 2 Packs, Reviews
    - Integrations: Canvas, Webhook
    """
    # 1. Institution
    inst = db.query(models.Institution).filter(models.Institution.code == "nust").first()
    if not inst:
        inst = models.Institution(
            name="National University of Sciences & Technology",
            code="nust",
            region="Pakistan",
            config={"domain": "nust.edu.pk", "theme": "blue"}
        )
        db.add(inst)
        db.commit()
        db.refresh(inst)

    # 2. Curricula (Ensure NUST CS exists)
    curr = db.query(models.Curriculum).filter(models.Curriculum.code == "nust_cs").first()
    if not curr:
        curr = models.Curriculum(
            code="nust_cs",
            name="NUST (CS/SE)",
            institution_id=inst.id,
            config={"subjects": ["PF", "OOP", "DSA", "Calculus"]}
        )
        db.add(curr)
    
    db.commit() # Save curriculum if created

    # 3. Users
    # Admin
    admin_user = db.query(models.User).filter(models.User.email == "admin@nust.edu.pk").first()
    if not admin_user:
        admin_user = models.User(
            email="admin@nust.edu.pk",
            full_name="System Admin",
            institution_id=inst.id,
            role=models.UserRole.INSTITUTION_ADMIN
        )
        db.add(admin_user)

    # Creator Student
    student = db.query(models.User).filter(models.User.email == "top_topper@nust.edu.pk").first()
    if not student:
        student = models.User(
            email="top_topper@nust.edu.pk",
            full_name="Ali Topper",
            institution_id=inst.id,
            curriculum_id=curr.id if curr else None,
            role=models.UserRole.STUDENT
        )
        db.add(student)
        db.commit() # Need ID for packs
        
        # Creator Profile
        cp = models.CreatorProfile(
            user_id=student.id,
            bio="GPA 4.0 Student. I simplify complex topics.",
            rating_avg=4.9,
            total_sales=150,
            is_verified=True
        )
        db.add(cp)
    
    db.commit()
    db.refresh(student)

    # 4. Marketplace Packs
    if db.query(models.StudyPack).count() == 0:
        pack1 = models.StudyPack(
            creator_id=student.id,
            title="DSA Finals - The Ultimate Cheatsheet",
            description="Complete graph algorithms, trees, and linked list tricks. Guaranteed A.",
            price=500.0,
            curriculum_code="nust_cs",
            subject_tag="Computer Science",
            rating_avg=4.8,
            is_published=True
        )
        pack2 = models.StudyPack(
            creator_id=student.id,
            title="Calculus II - Integration Solved",
            description="Step by step solutions for common Thomas Calculus problems.",
            price=0.0, # Free
            curriculum_code="nust_cs",
            subject_tag="Mathematics",
            rating_avg=4.5,
            is_published=True
        )
        db.add_all([pack1, pack2])
        
    # 5. Integrations & Hooks
    if db.query(models.Integration).filter(models.Integration.institution_id == inst.id).count() == 0:
        integ = models.Integration(
            institution_id=inst.id,
            name="Canvas LMS (Prod)",
            type="LMS",
            config={"url": "https://lms.nust.edu.pk", "sync_enabled": True}
        )
        db.add(integ)
        
    if db.query(models.WebhookSubscription).count() == 0:
        hook = models.WebhookSubscription(
            institution_id=inst.id,
            event_type="alert.raised",
            target_url="https://admin.nust.edu.pk/webhooks/ilmora",
            secret="uat_secret_123"
        )
        db.add(hook)

    db.commit()
    return {"status": "UAT Data Seeded", "institution": inst.name, "admin": admin_user.email}

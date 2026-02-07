from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Dict, Any, Optional
from uuid import uuid4
from app.api import deps
from app.models import sql_models as models
from pydantic import BaseModel, Field
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

class IncidentCreate(BaseModel):
    title: str
    status: str = "Investigating"
    severity: str = "Medium"
    owner: str = "NOC"
    region: str = "Global"
    impact: str = "New incident created."
    services: List[str] = Field(default_factory=list)

class IncidentStatusUpdate(BaseModel):
    status: str

class IncidentLog(BaseModel):
    id: str
    title: str
    status: str
    severity: str
    owner: str
    time: str
    region: str
    impact: str
    services: List[str]

class IncidentSummary(BaseModel):
    total: int
    investigating: int
    monitoring: int
    resolved: int

class IncidentListResponse(BaseModel):
    items: List[IncidentLog]
    total: int
    summary: IncidentSummary

class RoleAuditEvent(BaseModel):
    id: str
    actor: str
    action: str
    role: str
    time: str
    severity: str

class RoleAuditListResponse(BaseModel):
    items: List[RoleAuditEvent]
    total: int

class AuditEventResponse(BaseModel):
    id: str
    action: str
    actor: str
    target: str
    time: str
    severity: str

class IncidentNoteCreate(BaseModel):
    body: str
    author: Optional[str] = None

class IncidentNoteResponse(BaseModel):
    id: str
    body: str
    author: str
    time: str

class IncidentTimelineEntry(BaseModel):
    time: str
    note: str

class RunbookStepResponse(BaseModel):
    id: str
    label: str
    status: str

class SearchCountsResponse(BaseModel):
    incidents: int
    audit: int
    roles: int

class RestorePoint(BaseModel):
    id: str
    label: str
    age: str
    region: str

class RollbackHistory(BaseModel):
    id: str
    label: str
    time: str
    status: str

def _seed_incidents(db: Session) -> None:
    if db.query(models.Incident).count() > 0:
        return
    seeds = [
        models.Incident(
            title="Queue latency spikes",
            status="Investigating",
            severity="High",
            owner="NOC",
            region="EU",
            impact="Delayed sync jobs across EU regions.",
            services=["Realtime Sync", "Job Orchestrator"],
        ),
        models.Incident(
            title="Auth token issuer latency",
            status="Monitoring",
            severity="Medium",
            owner="Security",
            region="US",
            impact="Short login delays for 3 minutes.",
            services=["Identity", "API Gateway"],
        ),
        models.Incident(
            title="Search indexing lag",
            status="Resolved",
            severity="Low",
            owner="Operations",
            region="APAC",
            impact="Search freshness delayed by 12 minutes.",
            services=["Search", "Graph Ingest"],
        ),
    ]
    db.add_all(seeds)
    db.commit()

def _seed_role_audit(db: Session) -> None:
    if db.query(models.RoleAuditEvent).count() > 0:
        return
    seeds = [
        models.RoleAuditEvent(
            actor="security@ilmora.ai",
            action="Permission updated",
            role="Mentor",
            severity="Medium",
        ),
        models.RoleAuditEvent(
            actor="admin@atlas.edu",
            action="Role created",
            role="Institution Admin",
            severity="Low",
        ),
        models.RoleAuditEvent(
            actor="ops@ilmora.ai",
            action="Access revoked",
            role="System Admin",
            severity="High",
        ),
    ]
    db.add_all(seeds)
    db.commit()

def _seed_audit_events(db: Session) -> None:
    if db.query(models.AuditEvent).count() > 0:
        return
    seeds = [
        models.AuditEvent(
            action="Role updated",
            actor="admin@atlas.edu",
            target="Mentor • Access: Write",
            severity="Medium",
        ),
        models.AuditEvent(
            action="Data export requested",
            actor="security@ilmora.ai",
            target="Institution: Northbay",
            severity="High",
        ),
        models.AuditEvent(
            action="Schema migration",
            actor="ops@ilmora.ai",
            target="migration_2026_02_07",
            severity="Low",
        ),
    ]
    db.add_all(seeds)
    db.commit()

def _seed_runbook_steps(db: Session) -> None:
    if db.query(models.DatabaseRunbookStep).count() > 0:
        return
    seeds = [
        models.DatabaseRunbookStep(label="Confirm restore point", status="Ready", sort_order=1),
        models.DatabaseRunbookStep(label="Notify stakeholders", status="Pending", sort_order=2),
        models.DatabaseRunbookStep(label="Lock write traffic", status="Pending", sort_order=3),
        models.DatabaseRunbookStep(label="Run restore workflow", status="Pending", sort_order=4),
        models.DatabaseRunbookStep(label="Validate data integrity", status="Pending", sort_order=5),
    ]
    db.add_all(seeds)
    db.commit()

RESTORE_POINTS: List[RestorePoint] = [
    RestorePoint(id="rp1", label="Today 04:00", age="2h", region="us-east"),
    RestorePoint(id="rp2", label="Yesterday 23:00", age="7h", region="us-east"),
    RestorePoint(id="rp3", label="Yesterday 18:00", age="12h", region="eu-west"),
]

ROLLBACK_HISTORY: List[RollbackHistory] = [
    RollbackHistory(
        id="rb1",
        label="Migration 2024.12.08",
        time="Today 06:12",
        status="Completed",
    ),
    RollbackHistory(
        id="rb2",
        label="Migration 2024.12.02",
        time="Yesterday 21:40",
        status="Completed",
    ),
]

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

@router.get("/audit", response_model=List[AuditEventResponse])
def list_audit_events(
    skip: int = 0,
    limit: int = 50,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db),
):
    _seed_audit_events(db)
    query = db.query(models.AuditEvent)
    if severity and severity != "All":
        query = query.filter(models.AuditEvent.severity == severity)
    if search:
        needle = f"%{search}%"
        query = query.filter(
            or_(
                models.AuditEvent.action.ilike(needle),
                models.AuditEvent.actor.ilike(needle),
                models.AuditEvent.target.ilike(needle),
            ),
        )

    items = (
        query.order_by(models.AuditEvent.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        AuditEventResponse(
            id=item.id,
            action=item.action,
            actor=item.actor,
            target=item.target,
            time=(item.created_at.isoformat() if item.created_at else ""),
            severity=item.severity,
        )
        for item in items
    ]

@router.post("/audit/export")
def export_audit_events():
    return {"status": "queued"}

@router.post("/audit/ack")
def acknowledge_audit_events(db: Session = Depends(deps.get_db)):
    db.query(models.AuditEvent).delete()
    db.commit()
    return {"status": "acknowledged"}

@router.get("/system/incidents", response_model=IncidentListResponse)
def list_incidents(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db),
):
    _seed_incidents(db)
    base_query = db.query(models.Incident)
    if severity and severity != "All":
        base_query = base_query.filter(models.Incident.severity == severity)
    if search:
        needle = f"%{search}%"
        base_query = base_query.filter(
            or_(
                models.Incident.title.ilike(needle),
                models.Incident.owner.ilike(needle),
                models.Incident.region.ilike(needle),
                models.Incident.impact.ilike(needle),
            ),
        )

    total = base_query.count()

    status_query = base_query
    if status and status != "All":
        status_query = status_query.filter(models.Incident.status == status)
        filtered_total = status_query.count()
    else:
        filtered_total = total

    items = (
        status_query.order_by(models.Incident.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    summary = IncidentSummary(
        total=total,
        investigating=base_query.filter(models.Incident.status == "Investigating").count(),
        monitoring=base_query.filter(models.Incident.status == "Monitoring").count(),
        resolved=base_query.filter(models.Incident.status == "Resolved").count(),
    )

    def to_log(incident: models.Incident) -> IncidentLog:
        return IncidentLog(
            id=incident.id,
            title=incident.title,
            status=incident.status,
            severity=incident.severity,
            owner=incident.owner,
            time=(incident.created_at.isoformat() if incident.created_at else ""),
            region=incident.region,
            impact=incident.impact,
            services=incident.services or [],
        )

    return IncidentListResponse(
        items=[to_log(item) for item in items],
        total=filtered_total,
        summary=summary,
    )

@router.post("/system/incidents", response_model=IncidentLog)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(deps.get_db),
):
    incident = models.Incident(
        id=f"inc-{uuid4().hex[:8]}",
        title=payload.title,
        status=payload.status,
        severity=payload.severity,
        owner=payload.owner,
        region=payload.region,
        impact=payload.impact,
        services=payload.services,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    db.add(
        models.IncidentTimelineEvent(
            incident_id=incident.id,
            note="Incident created",
        ),
    )
    db.commit()
    return IncidentLog(
        id=incident.id,
        title=incident.title,
        status=incident.status,
        severity=incident.severity,
        owner=incident.owner,
        time=(incident.created_at.isoformat() if incident.created_at else ""),
        region=incident.region,
        impact=incident.impact,
        services=incident.services or [],
    )

@router.post("/system/incidents/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    payload: IncidentStatusUpdate,
    db: Session = Depends(deps.get_db),
):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.status = payload.status
    db.add(
        models.IncidentTimelineEvent(
            incident_id=incident.id,
            note=f"Status updated to {payload.status}",
        ),
    )
    db.commit()
    return {"status": "updated", "incident_id": incident_id}

@router.post("/system/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str, db: Session = Depends(deps.get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.status = "Resolved"
    db.add(
        models.IncidentTimelineEvent(
            incident_id=incident.id,
            note="Incident resolved",
        ),
    )
    db.commit()
    return {"status": "resolved", "incident_id": incident_id}

@router.get("/system/incidents/{incident_id}/timeline", response_model=List[IncidentTimelineEntry])
def list_incident_timeline(incident_id: str, db: Session = Depends(deps.get_db)):
    events = (
        db.query(models.IncidentTimelineEvent)
        .filter(models.IncidentTimelineEvent.incident_id == incident_id)
        .order_by(models.IncidentTimelineEvent.created_at.asc())
        .all()
    )
    return [
        IncidentTimelineEntry(
            time=(event.created_at.isoformat() if event.created_at else ""),
            note=event.note,
        )
        for event in events
    ]

@router.get("/system/incidents/{incident_id}/notes", response_model=List[IncidentNoteResponse])
def list_incident_notes(incident_id: str, db: Session = Depends(deps.get_db)):
    notes = (
        db.query(models.IncidentNote)
        .filter(models.IncidentNote.incident_id == incident_id)
        .order_by(models.IncidentNote.created_at.desc())
        .all()
    )
    return [
        IncidentNoteResponse(
            id=note.id,
            body=note.body,
            author=note.author,
            time=(note.created_at.isoformat() if note.created_at else ""),
        )
        for note in notes
    ]

@router.post("/system/incidents/{incident_id}/notes", response_model=IncidentNoteResponse)
def create_incident_note(
    incident_id: str,
    payload: IncidentNoteCreate,
    db: Session = Depends(deps.get_db),
):
    note = models.IncidentNote(
        incident_id=incident_id,
        body=payload.body,
        author=payload.author or "admin",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return IncidentNoteResponse(
        id=note.id,
        body=note.body,
        author=note.author,
        time=(note.created_at.isoformat() if note.created_at else ""),
    )

@router.get("/roles/audit", response_model=RoleAuditListResponse)
def list_role_audit(
    skip: int = 0,
    limit: int = 50,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db),
):
    _seed_role_audit(db)
    query = db.query(models.RoleAuditEvent)
    if severity and severity != "All":
        query = query.filter(models.RoleAuditEvent.severity == severity)
    if search:
        needle = f"%{search}%"
        query = query.filter(
            or_(
                models.RoleAuditEvent.actor.ilike(needle),
                models.RoleAuditEvent.action.ilike(needle),
                models.RoleAuditEvent.role.ilike(needle),
            ),
        )

    total = query.count()
    items = (
        query.order_by(models.RoleAuditEvent.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    def to_event(event: models.RoleAuditEvent) -> RoleAuditEvent:
        return RoleAuditEvent(
            id=event.id,
            actor=event.actor,
            action=event.action,
            role=event.role,
            time=(event.created_at.isoformat() if event.created_at else ""),
            severity=event.severity,
        )

    return RoleAuditListResponse(
        items=[to_event(item) for item in items],
        total=total,
    )

@router.get("/search/counts", response_model=SearchCountsResponse)
def search_counts(q: Optional[str] = None, db: Session = Depends(deps.get_db)):
    _seed_incidents(db)
    _seed_audit_events(db)
    _seed_role_audit(db)

    incident_query = db.query(models.Incident)
    audit_query = db.query(models.AuditEvent)
    role_query = db.query(models.RoleAuditEvent)

    if q:
        needle = f"%{q}%"
        incident_query = incident_query.filter(
            or_(
                models.Incident.title.ilike(needle),
                models.Incident.owner.ilike(needle),
                models.Incident.region.ilike(needle),
                models.Incident.impact.ilike(needle),
            ),
        )
        audit_query = audit_query.filter(
            or_(
                models.AuditEvent.action.ilike(needle),
                models.AuditEvent.actor.ilike(needle),
                models.AuditEvent.target.ilike(needle),
            ),
        )
        role_query = role_query.filter(
            or_(
                models.RoleAuditEvent.actor.ilike(needle),
                models.RoleAuditEvent.action.ilike(needle),
                models.RoleAuditEvent.role.ilike(needle),
            ),
        )

    return SearchCountsResponse(
        incidents=incident_query.count(),
        audit=audit_query.count(),
        roles=role_query.count(),
    )

@router.get("/database/restore-points", response_model=List[RestorePoint])
def list_restore_points():
    return RESTORE_POINTS

@router.get("/database/runbook", response_model=List[RunbookStepResponse])
def list_runbook_steps(db: Session = Depends(deps.get_db)):
    _seed_runbook_steps(db)
    steps = (
        db.query(models.DatabaseRunbookStep)
        .order_by(models.DatabaseRunbookStep.sort_order.asc())
        .all()
    )
    return [
        RunbookStepResponse(id=step.id, label=step.label, status=step.status)
        for step in steps
    ]

@router.post("/database/runbook/{step_id}/complete")
def complete_runbook_step(step_id: str, db: Session = Depends(deps.get_db)):
    step = (
        db.query(models.DatabaseRunbookStep)
        .filter(models.DatabaseRunbookStep.id == step_id)
        .first()
    )
    if not step:
        raise HTTPException(status_code=404, detail="Runbook step not found")
    step.status = "Done"
    db.commit()
    return {"status": "completed", "step_id": step_id}

@router.post("/database/runbook/reset")
def reset_runbook(db: Session = Depends(deps.get_db)):
    _seed_runbook_steps(db)
    steps = db.query(models.DatabaseRunbookStep).all()
    for step in steps:
        step.status = "Pending"
    first_step = (
        db.query(models.DatabaseRunbookStep)
        .order_by(models.DatabaseRunbookStep.sort_order.asc())
        .first()
    )
    if first_step:
        first_step.status = "Ready"
    db.commit()
    return {"status": "reset"}

@router.post("/database/restore-points/{restore_id}/restore")
def restore_from_point(restore_id: str):
    return {"status": "queued", "restore_id": restore_id}

@router.get("/database/rollback-history", response_model=List[RollbackHistory])
def list_rollback_history():
    return ROLLBACK_HISTORY

@router.post("/database/restore")
def create_point_in_time_restore():
    return {"status": "queued"}

@router.post("/database/rollback")
def rollback_migration():
    return {"status": "queued"}

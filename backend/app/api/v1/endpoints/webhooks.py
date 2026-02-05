from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import secrets
from app.api.dependencies import get_db, get_current_user
from app.models.sql_models import WebhookSubscription, User, UserRole
from app.schemas.webhook import WebhookCreate, WebhookResponse

router = APIRouter()

def verify_admin_access(user: User):
    if user.role not in [UserRole.INSTITUTION_ADMIN, UserRole.SYSTEM_ADMIN] and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to manage webhooks")

@router.post("/", response_model=WebhookResponse)
def create_webhook(
    webhook_in: WebhookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin_access(current_user)
    
    if not current_user.institution_id:
        raise HTTPException(status_code=400, detail="Must belong to an institution")

    # Generate a signing secret
    secret = secrets.token_hex(24)

    db_obj = WebhookSubscription(
        institution_id=current_user.institution_id,
        event_type=webhook_in.event_type,
        target_url=str(webhook_in.target_url),
        secret=secret,
        is_active=webhook_in.is_active
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[WebhookResponse])
def list_webhooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin_access(current_user)
    
    if not current_user.institution_id:
        return []

    return db.query(WebhookSubscription).filter(
        WebhookSubscription.institution_id == current_user.institution_id
    ).all()

@router.delete("/{webhook_id}")
def delete_webhook(
    webhook_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin_access(current_user)
    
    db_obj = db.query(WebhookSubscription).filter(
        WebhookSubscription.id == webhook_id,
        WebhookSubscription.institution_id == current_user.institution_id
    ).first()
    
    if not db_obj:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    db.delete(db_obj)
    db.commit()
    return {"status": "success"}

# --- Internal Service Stub ---
# In a real microservices architecture, this would be a separate worker.
# For now, we put the logic here to show how we WOULD dispatch events.

def dispatch_event(db: Session, institution_id: str, event_type: str, payload: dict):
    """
    Finds matching webhooks and sends valid POST requests.
    (This is synchronous for Phase 3 POC, but should be Celery task in Phase 4)
    """
    hooks = db.query(WebhookSubscription).filter(
        WebhookSubscription.institution_id == institution_id,
        WebhookSubscription.event_type == event_type,
        WebhookSubscription.is_active == True
    ).all()
    
    results = []
    for hook in hooks:
        # Pseudo-code for sending request
        # requests.post(hook.target_url, json=payload, headers={'X-Ilmora-Signature': ...})
        results.append(f"Dispatched to {hook.target_url}")
        
    return results

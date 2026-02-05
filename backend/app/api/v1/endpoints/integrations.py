from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.sql_models import Integration, User, UserRole
from app.schemas.integration import IntegrationCreate, IntegrationUpdate, IntegrationResponse

router = APIRouter()

def verify_admin_access(user: User):
    if user.role not in [UserRole.INSTITUTION_ADMIN, UserRole.SYSTEM_ADMIN] and not user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized to manage integrations")

@router.post("/", response_model=IntegrationResponse)
def create_integration(
    integration_in: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin_access(current_user)
    
    # Ensure institution context
    if not current_user.institution_id:
        raise HTTPException(status_code=400, detail="User must belong to an institution to add integrations")

    # Basic logic for API Key handling (In production, encrypt this!)
    api_key_stored = integration_in.api_key_value if integration_in.api_key_value else None

    db_obj = Integration(
        institution_id=current_user.institution_id,
        name=integration_in.name,
        type=integration_in.type,
        config=integration_in.config,
        is_active=integration_in.is_active,
        api_key=api_key_stored
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[IntegrationResponse])
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin_access(current_user)
    
    if not current_user.institution_id:
        return []

    return db.query(Integration).filter(Integration.institution_id == current_user.institution_id).all()

@router.put("/{integration_id}", response_model=IntegrationResponse)
def update_integration(
    integration_id: str,
    integration_in: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin_access(current_user)
    
    db_obj = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.institution_id == current_user.institution_id
    ).first()
    
    if not db_obj:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    if integration_in.name:
        db_obj.name = integration_in.name
    if integration_in.config is not None:
        db_obj.config = integration_in.config
    if integration_in.is_active is not None:
        db_obj.is_active = integration_in.is_active
    if integration_in.api_key_value:
        db_obj.api_key = integration_in.api_key_value
        
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/{integration_id}")
def delete_integration(
    integration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_admin_access(current_user)
    
    db_obj = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.institution_id == current_user.institution_id
    ).first()
    
    if not db_obj:
        raise HTTPException(status_code=404, detail="Integration not found")
        
    db.delete(db_obj)
    db.commit()
    return {"status": "success"}

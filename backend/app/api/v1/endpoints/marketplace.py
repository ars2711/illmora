from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from app.api import dependencies as deps
from app.models import sql_models as models
from app.schemas import marketplace as schemas
from app.services.cache_service import cache
import json

router = APIRouter()

@router.get("/packs", response_model=List[schemas.StudyPackResponse])
def list_study_packs(
    skip: int = 0,
    limit: int = 20,
    curriculum: Optional[str] = None,
    subject: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db),
):
    """
    Marketplace Feed with Redis Caching (TTL: 5 min).
    """
    # 1. Check Cache
    cache_key = cache.generate_key("marketplace:packs", skip=skip, limit=limit, curriculum=curriculum, subject=subject, search=search)
    cached_data = cache.get(cache_key)
    
    if cached_data:
        # Deserialize manually to Pydantic if needed, or if cached_data is just list of dicts
        # Pydantic models can ingest dicts directly in response, but let's be safe
        return cached_data

    # 2. Database Query
    query = db.query(models.StudyPack).filter(models.StudyPack.is_published == True)
    
    if curriculum:
        query = query.filter(models.StudyPack.curriculum_code == curriculum)
    if subject:
        query = query.filter(models.StudyPack.subject_tag.ilike(f"%{subject}%"))
    if search:
        query = query.filter(models.StudyPack.title.ilike(f"%{search}%"))
        
    packs = query.order_by(desc(models.StudyPack.rating_avg)).offset(skip).limit(limit).all()
    
    # Enrich with creator names & Serialize
    results = []
    for p in packs:
        p_resp = schemas.StudyPackResponse.model_validate(p)
        if p.creator:
            p_resp.creator_name = p.creator.full_name
        results.append(p_resp.model_dump()) # Store as dict for JSON serialization
        
    # 3. Set Cache
    cache.set(cache_key, results, ttl=300)
    
    return results

@router.post("/packs", response_model=schemas.StudyPackResponse)
def create_draft_pack(
    pack_in: schemas.StudyPackCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Start creating a study pack (Draft).
    """
    new_pack = models.StudyPack(
        creator_id=current_user.id,
        title=pack_in.title,
        description=pack_in.description,
        price=pack_in.price,
        curriculum_code=pack_in.curriculum_code,
        subject_tag=pack_in.subject_tag,
        is_published=False
    )
    db.add(new_pack)
    db.commit()
    db.refresh(new_pack)
    return new_pack

@router.post("/packs/{pack_id}/items", response_model=schemas.PackItemResponse)
def add_item_to_pack(
    pack_id: str,
    item_in: schemas.PackItemCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Add a Note or Document to the pack.
    Verifies ownership of the original content.
    """
    pack = db.query(models.StudyPack).filter(models.StudyPack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    if pack.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your pack")
        
    # Verify content ownership
    if item_in.note_id:
        note = db.query(models.Note).filter(models.Note.id == item_in.note_id, models.Note.user_id == current_user.id).first()
        if not note:
             raise HTTPException(status_code=404, detail="Note not found or not owned by you")
    
    if item_in.document_id:
        doc = db.query(models.Document).filter(models.Document.id == item_in.document_id, models.Document.user_id == current_user.id).first()
        if not doc:
             raise HTTPException(status_code=404, detail="Document not found or not owned by you")

    new_item = models.PackItem(
        pack_id=pack.id,
        title=item_in.title,
        note_id=item_in.note_id,
        document_id=item_in.document_id
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/packs/{pack_id}/publish", response_model=schemas.StudyPackResponse)
def publish_pack(
    pack_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Publish the pack to the marketplace.
    """
    pack = db.query(models.StudyPack).filter(models.StudyPack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    if pack.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your pack")
        
    pack.is_published = True
    db.commit()
    db.refresh(pack)
    return pack

@router.get("/packs/{pack_id}", response_model=schemas.StudyPackResponse)
def get_pack_details(
    pack_id: str,
    db: Session = Depends(deps.get_db),
):
    pack = db.query(models.StudyPack).filter(models.StudyPack.id == pack_id).first()
    if not pack:
        raise HTTPException(status_code=404, detail="Pack not found")
    return pack

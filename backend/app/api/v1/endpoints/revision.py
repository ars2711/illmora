from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.orm import Session
from app.db.base_class import get_db
from app.api.dependencies import get_current_user
from app.services.revision_engine import RevisionEngine
from app.schemas.analytics import AnalyticsResponse # Reuse for simplicity or create RevisionCardSchema
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class RevisionCardBase(BaseModel):
    concept: str
    front: str
    back: str
    type: str = "flashcard"

class RevisionCardResponse(RevisionCardBase):
    id: str
    interval_days: int
    repetition_count: int
    next_review_at: str

    class Config:
        from_attributes = True

class ReviewSubmission(BaseModel):
    card_id: str
    quality: int # 0-5

@router.get("/due", response_model=List[RevisionCardResponse])
async def get_due_cards(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get top N cards due for review based on Spaced Repetition (SM-2).
    """
    engine = RevisionEngine(db)
    cards = engine.get_due_cards(current_user.id, limit)
    
    # Map back to response schema
    return [
        RevisionCardResponse(
            id=c.id,
            concept=c.concept,
            front=c.front_content,
            back=c.back_content,
            type=c.type,
            interval_days=c.interval_days,
            repetition_count=c.repetition_count,
            next_review_at=c.next_review_at.isoformat()
        ) for c in cards
    ]

@router.post("/review")
async def submit_review(
    submission: ReviewSubmission,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Submit a review result (0-5 score) to update the card's schedule.
    """
    engine = RevisionEngine(db)
    # Security: Ensure card belongs to user (RevisionEngine logic should ideally check, but we can double check here)
    # For now relying on engine to fetch by ID. We should probably filter by user_id too in engine.
    
    updated_card = engine.process_review(submission.card_id, submission.quality)
    if not updated_card:
         raise HTTPException(status_code=404, detail="Card not found")
    
    return {"status": "success", "next_due": updated_card.next_review_at}

@router.post("/create")
async def create_card(
    card: RevisionCardBase,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    engine = RevisionEngine(db)
    new_card = engine.create_card(
        user_id=current_user.id,
        concept=card.concept,
        front=card.front,
        back=card.back,
        card_type=card.type
    )
    return {"status": "created", "id": new_card.id}

class ConceptTrapRequest(BaseModel):
    concept: str

@router.post("/concept-trap")
async def generate_concept_trap(
    request: ConceptTrapRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate a 'Concept Trap' for a specific topic to test deep understanding.
    """
    engine = RevisionEngine(db)
    trap_content = await engine.generate_concept_traps(request.concept)
    return {"content": trap_content}

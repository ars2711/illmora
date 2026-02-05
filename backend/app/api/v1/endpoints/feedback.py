from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.sql_models import Feedback, User
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

router = APIRouter()

@router.post("/", response_model=FeedbackResponse)
def submit_feedback(
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit user feedback.
    """
    feedback = Feedback(
        user_id=current_user.id,
        feature_context=feedback_in.feature_context,
        content=feedback_in.content,
        sentiment=feedback_in.sentiment
    )
    db.add(feedback)
    db.commit()
    
    return FeedbackResponse(msg="Feedback received. Thank you.")

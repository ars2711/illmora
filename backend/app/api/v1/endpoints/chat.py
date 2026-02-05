from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse
from app.services.ai.router import AIRouter
from app.models.sql_models import User, Interaction
from app.services.rate_limiter import limiter

router = APIRouter()

@router.post("/", response_model=ChatMessageResponse)
async def chat_sync(
    request: Request,
    msg: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Receives a chat message (likely from offline sync), processes it via AI Router,
    and returns the complete response.
    Hardening: Implements Idempotency Check.
    """
    # 0. Rate Limit
    await limiter.check(request, current_user.id)

    # 1. Idempotency Check
    if msg.tempId:
        existing = db.query(Interaction).filter(
            Interaction.user_id == current_user.id, 
            Interaction.client_ref_id == msg.tempId
        ).first()
        
        if existing:
            # Return cached response if already processed
            return ChatMessageResponse(
                response=existing.ai_response,
                interaction_id=existing.id
            )

    ai_router = AIRouter(db)
    
    # We consume the generator fully to get the complete response
    # and ensure side-effects (DB saving) happen.
    full_response = ""
    async for chunk in ai_router.process_chat(
        user_id=current_user.id,
        prompt=msg.content,
        session_id=msg.sessionId,
        client_ref_id=msg.tempId,
        mode=msg.mode
    ):
        full_response += chunk

    return ChatMessageResponse(
        response=full_response,
        interaction_id="generated-id" 
    )

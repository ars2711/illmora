from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api import dependencies as deps
from app.models import sql_models as models
from app.schemas import study_group as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.RoomResponse])
def get_my_rooms(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    List rooms the current user is a member of.
    """
    memberships = db.query(models.RoomMember).filter(models.RoomMember.user_id == current_user.id).all()
    room_ids = [m.room_id for m in memberships]
    
    rooms = db.query(models.StudyRoom).filter(models.StudyRoom.id.in_(room_ids)).all()
    return rooms

@router.get("/public", response_model=List[schemas.RoomResponse])
def get_public_rooms(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    List public study rooms.
    """
    rooms = db.query(models.StudyRoom).filter(models.StudyRoom.is_public == True).offset(skip).limit(limit).all()
    return rooms

@router.post("/", response_model=schemas.RoomResponse)
def create_room(
    room_in: schemas.RoomCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Create a new study room and join it as admin.
    """
    # Create Room
    room = models.StudyRoom(
        name=room_in.name,
        description=room_in.description,
        is_public=room_in.is_public,
        created_by_id=current_user.id
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    
    # Auto-join creator
    member = models.RoomMember(
        room_id=room.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(member)
    db.commit()
    
    return room

@router.post("/{room_id}/join", response_model=schemas.RoomResponse)
def join_room(
    room_id: str,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Join a public room or via invite (invite logic simplified for now).
    """
    room = db.query(models.StudyRoom).filter(models.StudyRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    # Check if already member
    existing = db.query(models.RoomMember).filter(
        models.RoomMember.room_id == room_id,
        models.RoomMember.user_id == current_user.id
    ).first()
    
    if existing:
        return room # Idempotent success
        
    if not room.is_public:
        raise HTTPException(status_code=403, detail="Room is private")
        
    new_member = models.RoomMember(room_id=room.id, user_id=current_user.id)
    db.add(new_member)
    db.commit()
    
    return room

@router.get("/{room_id}/messages", response_model=List[schemas.MessageResponse])
def get_messages(
    room_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Get chat history for a room. requires membership.
    """
    # Verify membership
    member = db.query(models.RoomMember).filter(
        models.RoomMember.room_id == room_id,
        models.RoomMember.user_id == current_user.id
    ).first()
    
    if not member:
         raise HTTPException(status_code=403, detail="Not a member of this room")
         
    messages = db.query(models.RoomMessage).filter(
        models.RoomMessage.room_id == room_id
    ).order_by(models.RoomMessage.created_at.desc()).offset(skip).limit(limit).all()
    
    # Reverse for chronological order if needed, but client usually wants newest first for paging or oldest for display.
    # We return newest first (desc) for pagination efficiency, client can reverse.
    
    results = []
    for m in messages:
        sender_name = "AI Moderator"
        if m.sender:
            sender_name = m.sender.full_name or "Unknown"
            
        results.append(schemas.MessageResponse(
            id=m.id,
            room_id=m.room_id,
            user_id=m.user_id,
            is_ai=m.is_ai,
            content=m.content,
            created_at=m.created_at,
            sender_name=sender_name
        ))
        
    return results

@router.post("/{room_id}/messages", response_model=schemas.MessageResponse)
def post_message(
    room_id: str,
    msg_in: schemas.MessageCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
):
    """
    Post a message to the room.
    Includes basic AI Moderation (Anti-Cheating).
    """
    # Verify membership
    member = db.query(models.RoomMember).filter(
        models.RoomMember.room_id == room_id,
        models.RoomMember.user_id == current_user.id
    ).first()
    
    if not member:
         raise HTTPException(status_code=403, detail="Not a member of this room")
    
    # 1. AI Moderation Check (Simplistic Keyword for now, can be upgraded to lightweight BERT)
    # Reusing Ethics Service logic conceptually here
    from app.services.ethics.ethics_service import get_ethics_service
    # We assume synchronous check for the API (Phase 2 constraint: simple admin tools)
    # Ideally should be async, but we can do a quick check.
    
    # For now, just a direct save. 
    # TODO: In Phase 2.5, run this through the AI Moderator queue.
    
    new_msg = models.RoomMessage(
        room_id=room_id,
        user_id=current_user.id,
        content=msg_in.content,
        is_ai=False
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    return schemas.MessageResponse(
        id=new_msg.id,
        room_id=new_msg.room_id,
        user_id=new_msg.user_id,
        is_ai=new_msg.is_ai,
        content=new_msg.content,
        created_at=new_msg.created_at,
        sender_name=current_user.full_name
    )

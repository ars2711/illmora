from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Room Schemas ---
class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: str
    created_by_id: str
    created_at: datetime
    # We can add computed fields in the endpoint if needed, or mapped fields
    
    class Config:
        from_attributes = True

# --- Message Schemas ---
class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    room_id: str
    user_id: Optional[str]
    is_ai: bool
    content: str
    created_at: datetime
    sender_name: Optional[str] = None # To be populated by API

    class Config:
        from_attributes = True

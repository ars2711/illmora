from pydantic import BaseModel
from typing import Optional

class ChatMessageCreate(BaseModel):
    sessionId: str
    content: str
    tempId: Optional[str] = None
    role: str = "user"
    mode: Optional[str] = "creative" # Added for Quiz/explain modes

class ChatMessageResponse(BaseModel):
    response: str
    interaction_id: str

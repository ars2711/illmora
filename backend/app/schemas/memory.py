from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class MemoryBase(BaseModel):
    content: str
    memory_type: str = "episodic"

class MemoryCreate(MemoryBase):
    user_id: str
    source_interaction_id: Optional[str] = None
    importance_score: float = 0.5 

class MemoryResponse(MemoryBase):
    id: str
    created_at: datetime
    score: Optional[float] = None # For search results quality

    class Config:
        from_attributes = True

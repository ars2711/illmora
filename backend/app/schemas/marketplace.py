from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Items ---
class PackItemBase(BaseModel):
    title: str
    note_id: Optional[str] = None
    document_id: Optional[str] = None

class PackItemCreate(PackItemBase):
    pass

class PackItemResponse(PackItemBase):
    id: str
    pack_id: str

    class Config:
        from_attributes = True

# --- Reviews ---
class ReviewCreate(BaseModel):
    rating: int # 1-5
    comment: Optional[str] = None

class ReviewResponse(ReviewCreate):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Packs ---
class StudyPackBase(BaseModel):
    title: str
    description: str
    price: float = 0.0
    curriculum_code: Optional[str] = None
    subject_tag: Optional[str] = None
    
class StudyPackCreate(StudyPackBase):
    pass

class StudyPackResponse(StudyPackBase):
    id: str
    creator_id: str
    is_published: bool
    download_count: int
    rating_avg: float
    created_at: datetime
    creator_name: Optional[str] = None # Enriched
    
    items: List[PackItemResponse] = []
    
    class Config:
        from_attributes = True

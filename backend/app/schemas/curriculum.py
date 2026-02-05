from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class CurriculumBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = {}
    is_active: bool = True

class CurriculumCreate(CurriculumBase):
    pass

class CurriculumUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class Curriculum(CurriculumBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

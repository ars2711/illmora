from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class IntegrationBase(BaseModel):
    name: str # e.g. "Canvas LMS"
    type: str # "LMS", "PAYMENT", "SSO"
    config: Optional[Dict[str, Any]] = {}
    is_active: Optional[bool] = True

class IntegrationCreate(IntegrationBase):
    api_key_value: Optional[str] = None # Passed once, encrypted in DB

class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    api_key_value: Optional[str] = None

class IntegrationResponse(IntegrationBase):
    id: str
    institution_id: str
    created_at: datetime
    # Never return API key
    
    class Config:
        from_attributes = True

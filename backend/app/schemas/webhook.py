from typing import Optional
from pydantic import BaseModel, HttpUrl
from datetime import datetime

class WebhookBase(BaseModel):
    event_type: str # "user.created", "alert.safety", "pack.purchase"
    target_url: HttpUrl
    is_active: Optional[bool] = True

class WebhookCreate(WebhookBase):
    pass

class WebhookResponse(WebhookBase):
    id: str
    institution_id: str
    secret: str # Returned only on creation usually, but sticking to simple for now
    created_at: datetime
    
    class Config:
        from_attributes = True

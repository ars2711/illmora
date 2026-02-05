from pydantic import BaseModel
from typing import Optional

class FeedbackCreate(BaseModel):
    feature_context: str
    content: str
    sentiment: Optional[str] = "neutral"

class FeedbackResponse(BaseModel):
    msg: str

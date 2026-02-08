from typing import Optional
from pydantic import BaseModel


class ClassCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class ClassJoinRequest(BaseModel):
    code: str


class ClassResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    join_code: str
    join_url: str
    created_at: str

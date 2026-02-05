from typing import List, Optional
from pydantic import BaseModel

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    curriculum_id: Optional[str] = None
    degree: Optional[str] = None
    semester: Optional[str] = None
    subjects: Optional[List[str]] = []
    preferred_language: Optional[str] = "English"
    learning_style: Optional[str] = None
    career_goals: Optional[List[str]] = []

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str]
    curriculum_id: Optional[str] = None
    profile_completed: bool = False

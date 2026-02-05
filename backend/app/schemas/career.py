from typing import List, Optional
from pydantic import BaseModel

class CareerRoadmapRequest(BaseModel):
    target_role: Optional[str] = None # If user wants to explore a specific role

class CareerRoadmapResponse(BaseModel):
    roadmap_content: str # Markdown formatted roadmap
    suggested_modules: List[str] # List of concepts/modules to study
    estimated_time: str # "6 months", etc.

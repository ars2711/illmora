from typing import List, Optional
from pydantic import BaseModel
from app.models.sql_models import EdgeType

# ReactFlow compatible schemas

class GraphNode(BaseModel):
    id: str
    type: str = "default" # input, output, default
    data: dict # label, etc
    position: dict # { x: 0, y: 0 } - separate layout service usually calculates this
    
class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: bool = False

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

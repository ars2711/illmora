from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.schemas.graph import GraphResponse, GraphNode, GraphEdge
from app.services.graph.knowledge_service import KnowledgeGraphService

router = APIRouter()

@router.get("/", response_model=GraphResponse)
def get_graph_visualization(db: Session = Depends(get_db)):
    """
    Returns the full knowledge graph for visualization.
    """
    service = KnowledgeGraphService(db)
    data = service.get_full_graph_data()
    
    # Transform to ReactFlow format
    nodes = []
    for i, n in enumerate(data["nodes"]):
        # Simple grid layout logic for prototype to prevent overlapping
        # In prod, we'd use dagre or elkjs on frontend
        x_pos = (i % 3) * 250
        y_pos = (i // 3) * 150
        
        nodes.append(GraphNode(
            id=n.id,
            data={"label": n.name, "domain": n.domain},
            position={"x": x_pos, "y": y_pos},
            type="default" # or custom type
        ))
        
    edges = []
    for e in data["edges"]:
        edges.append(GraphEdge(
            id=e.id,
            source=e.source_node_id,
            target=e.target_node_id,
            label=e.relation_type,
            animated=True
        ))
        
    return GraphResponse(nodes=nodes, edges=edges)

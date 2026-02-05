from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.sql_models import KnowledgeNode, KnowledgeEdge, EdgeType, UserConceptMastery

class KnowledgeGraphService:
    def __init__(self, db: Session):
        self.db = db

    def get_full_graph_data(self) -> dict:
        """
        Fetches all nodes and edges for visualization.
        """
        nodes = self.db.execute(select(KnowledgeNode)).scalars().all()
        edges = self.db.execute(select(KnowledgeEdge)).scalars().all()
        return {"nodes": nodes, "edges": edges}

    def get_node_by_slug(self, slug: str) -> Optional[KnowledgeNode]:
        return self.db.scalar(select(KnowledgeNode).where(KnowledgeNode.slug == slug))

    def get_prerequisites(self, node_id: str) -> List[KnowledgeNode]:
        """
        Returns all nodes that are immediate prerequisites for the given node.
        """
        stmt = (
            select(KnowledgeNode)
            .join(KnowledgeEdge, KnowledgeEdge.source_node_id == KnowledgeNode.id)
            .where(
                KnowledgeEdge.target_node_id == node_id,
                KnowledgeEdge.relation_type == EdgeType.PREREQUISITE
            )
        )
        return self.db.execute(stmt).scalars().all()

    def get_related_concepts(self, node_id: str) -> List[KnowledgeNode]:
        """
        Returns related concepts (bidirectional).
        """
        # Simplification: just checking outgoing edges for now. 
        # Ideal graph query would check both directions.
        stmt = (
            select(KnowledgeNode)
            .join(KnowledgeEdge, KnowledgeEdge.target_node_id == KnowledgeNode.id)
            .where(
                KnowledgeEdge.source_node_id == node_id,
                KnowledgeEdge.relation_type == EdgeType.RELATED
            )
        )
        return self.db.execute(stmt).scalars().all()

    def get_learning_path_recursive(self, target_node_id: str, visited=None) -> List[str]:
        """
        Hardening: Deep traversal to find full dependency chain.
        Returns ordered list of node_ids needed to master the target.
        """
        if visited is None: visited = set()
        
        if target_node_id in visited:
            return [] # Cycle detected or already processed
        
        visited.add(target_node_id)
        
        prereqs = self.get_prerequisites(target_node_id)
        path = []
        
        for p in prereqs:
            path.extend(self.get_learning_path_recursive(p.id, visited))
            
        path.append(target_node_id)
        return path

    def find_missing_prerequisites(self, user_id: str, target_node_id: str) -> List[KnowledgeNode]:
        """
        Hardening: 'Missing Concept' Resolver.
        Compares required learning path against user's mastery.
        Returns nodes in the path that have mastery_score < 0.7
        """
        required_ids = self.get_learning_path_recursive(target_node_id)
        
        # Get user's current mastery for these nodes
        stmt = (
            select(UserConceptMastery)
            .where(
                UserConceptMastery.user_id == user_id,
                UserConceptMastery.node_id.in_(required_ids)
            )
        )
        mastery_records = {m.node_id: m.mastery_score for m in self.db.execute(stmt).scalars().all()}
        
        missing = []
        for nid in required_ids:
            score = mastery_records.get(nid, 0.0)
            if score < 0.7:
                 # Fetch actual node object (optimization: could fetch all at once above)
                 node = self.db.get(KnowledgeNode, nid)
                 if node: missing.append(node)
                 
        return missing

    def update_user_mastery(self, user_id: str, node_id: str, is_correct: bool):
        """
        Updates the mastery score based on interaction outcome.
        Simple logic: +0.1 for correct, -0.05 for incorrect.
        """
        mastery = self.db.scalar(
            select(UserConceptMastery).where(
                UserConceptMastery.user_id == user_id,
                UserConceptMastery.node_id == node_id
            )
        )
        
        if not mastery:
            mastery = UserConceptMastery(user_id=user_id, node_id=node_id, mastery_score=0.0)
            self.db.add(mastery)
        
        if is_correct:
            mastery.mastery_score = min(1.0, mastery.mastery_score + 0.1)
        else:
            mastery.mastery_score = max(0.0, mastery.mastery_score - 0.05)
            mastery.mistake_count += 1
            
        self.db.commit()
        return mastery

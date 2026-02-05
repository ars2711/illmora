from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.models.sql_models import Memory, UserConceptMastery, MemoryType
from app.schemas.memory import MemoryCreate
from app.services.ai.base import BaseLLMService
from app.services.ai.factory import AIFactory

class MemoryService:
    def __init__(self, db: Session):
        self.db = db
        # We use a factory to get the embedding service, defaulting to OpenAI for now
        self.ai_service: BaseLLMService = AIFactory.get_service()

    async def add_interaction_memory(
        self, 
        user_id: str, 
        user_input: str, 
        ai_response: str, 
        interaction_id: str
    ):
        """
        Stores a chat exchange as ephemeral short-term memory.
        Implements Memory Governance:
        1. Calculates importance score dynamically.
        2. Discards "noise" (importance < 0.1).
        """
        combined_text = f"User: {user_input}\nAssistant: {ai_response}"
        
        # Governance: Calculate Importance
        score = self._calculate_importance(user_input, ai_response)
        
        # Governance: Noise Filter
        if score < 0.1:
            return None # Skip storage for "Hello", "Thanks", etc.

        embedding = await self.ai_service.get_embeddings(combined_text)
        
        memory = Memory(
            user_id=user_id,
            content=combined_text,
            embedding=embedding,
            memory_type=MemoryType.SHORT_TERM,
            source_interaction_id=interaction_id,
            importance_score=score
        )
        self.db.add(memory)
        self.db.commit()
        return memory

    def _calculate_importance(self, user_input: str, ai_response: str) -> float:
        """
        Heuristic-based importance scoring (0.0 - 1.0).
        TODO: Phase 1 - Replace with LLM-based scoring or sentiment analysis.
        """
        score = 0.3 # Default baseline
        
        text_len = len(user_input) + len(ai_response)
        input_lower = user_input.lower()
        
        # Boosters
        if text_len > 200: score += 0.2
        if "?" in user_input: score += 0.1 # Questions are valuable context
        if "don't understand" in input_lower or "explain" in input_lower: score += 0.3 # Confusion markers
        if "remember" in input_lower: score += 0.4 # Explicit instruction
        
        # Detractors
        if text_len < 20: score -= 0.2 # Brief phatic comms
        if any(word in input_lower for word in ["hi", "hello", "thanks", "ok", "bye"]): score -= 0.1
        
        return max(0.0, min(1.0, score))

    async def add_long_term_insight(self, user_id: str, insight: str):
        """
        Stores a crystallized fact about the user (e.g., "User struggles with Recursion").
        """
        embedding = await self.ai_service.get_embeddings(insight)
        memory = Memory(
            user_id=user_id,
            content=insight,
            embedding=embedding,
            memory_type=MemoryType.LONG_TERM,
            importance_score=0.9 # High importance for insights
        )
        self.db.add(memory)
        self.db.commit()
        return memory

    async def search_relevant_context(self, user_id: str, query: str, limit: int = 5) -> List[Memory]:
        """
        Retrieves relevant memories using vector similarity.
        """
        query_embedding = await self.ai_service.get_embeddings(query)
        
        # PGVector syntax: embedding <-> query_embedding (Cosine distance)
        # We order by distance, so smallest distance = most similar
        stmt = (
            select(Memory)
            .filter(Memory.user_id == user_id)
            .order_by(Memory.embedding.cosine_distance(query_embedding))
            .limit(limit)
        )
        results = self.db.execute(stmt).scalars().all()
        return results

    async def get_concept_gaps(self, user_id: str, limit: int = 3):
        """
        Queries UserConceptMastery to find weak spots.
        """
        stmt = (
            select(UserConceptMastery)
            .filter(UserConceptMastery.user_id == user_id)
            .order_by(desc(UserConceptMastery.mistake_count)) # Most mistakes first
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()

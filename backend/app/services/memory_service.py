from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.models.sql_models import Memory, Document, DocumentChunk, UserConceptMastery, MemoryType
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
        Retrieves relevant memories AND document chunks using vector similarity.
        Returns a mixed list of Memory objects.
        """
        query_embedding = await self.ai_service.get_embeddings(query)
        
        # 1. Search Core Memory (Interactions / Insights)
        try:
            memories = self.db.query(Memory).filter(
                Memory.user_id == user_id
            ).order_by(
                Memory.embedding.l2_distance(query_embedding)
            ).limit(limit).all()
        except Exception as e:
            print(f"Vector search (Memory) failed: {e}")
            memories = []

        # 2. Search Document Knowledge (RAG)
        try:
            # Join with Document to filter by user_id
            # Note: We query distinct chunks.
            query = self.db.query(DocumentChunk).join(Document, Document.id == DocumentChunk.document_id).filter(
                Document.user_id == user_id
            )
            
            # Add Vector op if available, otherwise just use simple filter for dev
            try:
                 query = query.order_by(DocumentChunk.embedding.l2_distance(query_embedding))
            except:
                 pass
            
            doc_chunks = query.limit(limit).all()

            # Convert Chunks to Memory-like Objects for Router Consumption
            for chunk in doc_chunks:
                # Add source metadata from parent doc
                source_title = chunk.document.title if chunk.document else "Unknown Document"
                
                simulated_memory = Memory(
                    content=chunk.content,
                    memory_type=MemoryType.KNOWLEDGE_GRAPH, # Use KG type for RAG
                    metadata_={"filename": source_title, "chunk_id": chunk.id}
                )
                memories.append(simulated_memory)

        except Exception as e:
            print(f"Vector search (Documents) failed: {e}")

        # 3. Sort Combined Results & Limit
        # Since we don't have distance readily available in Python object here without extra query logic,
        # we'll trust the DB sort for each group and just take the best of both.
        # In a strict system, we'd select distance as a column.
        # For MVP: Return top matches from both sources.
        
        return memories[:limit*2] 

    async def ingest_document(self, user_id: str, content: str, metadata: dict) -> bool:
        """
        Chunks and embeds a document for RAG.
        """
        # 1. Chunking Strategy (Simple overlapping window)
        chunk_size = 500 # chars
        overlap = 50
        
        chunks = []
        for i in range(0, len(content), chunk_size - overlap):
            chunk_text = content[i:i + chunk_size]
            chunks.append(chunk_text)
            
        # 2. Embedding & Storage
        for chunk in chunks:
            embedding = await self.ai_service.get_embeddings(chunk)
            
            # This would be `DocumentChunk` model in a real DB
            # For now, we store it as a special type of Memory so it's searchable
            doc_memory = Memory(
                user_id=user_id,
                content=f"[SOURCE: {metadata.get('filename', 'Doc')}] {chunk}",
                embedding=embedding,
                memory_type=MemoryType.KNOWLEDGE_GRAPH, # Using KG type for docs for now
                importance_score=0.5,
                metadata_=metadata # json field
            )
            self.db.add(doc_memory)
            
        self.db.commit()
        return True
        
        # 1. Fetch Memories (Episodic/Short Term)
        stmt_mem = (
            select(Memory)
            .filter(Memory.user_id == user_id)
            .order_by(Memory.embedding.cosine_distance(query_embedding))
            .limit(limit)
        )
        memories = self.db.execute(stmt_mem).scalars().all()

        # 2. Fetch Document Chunks (Semantic Knowledge)
        # Join with Document to respect ownership
        stmt_doc = (
            select(DocumentChunk)
            .join(Document)
            .filter(Document.user_id == user_id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(limit) 
        )
        chunks = self.db.execute(stmt_doc).scalars().all()
        
        # Combine results
        # In a more advanced system, we'd rerank these.
        combined = []
        combined.extend(memories)
        combined.extend(chunks)
        
        return combined


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

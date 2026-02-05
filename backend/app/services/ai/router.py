from typing import List, Dict, AsyncGenerator
from sqlalchemy.orm import Session
from app.services.ai.factory import AIFactory
from app.services.memory_service import MemoryService
from app.services.ethics.ethics_service import get_ethics_service
from app.models.sql_models import Interaction, InteractionType, User

class AIRouter:
    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIFactory.get_service()
        self.memory_service = MemoryService(db)
        self.ethics_service = get_ethics_service()

    async def process_chat(
        self, 
        user_id: str, 
        prompt: str, 
        session_id: str,
        mode: str = "creative", # creative, deterministic, socratic
        client_ref_id: str = None # Hardening: Idempotency Key
    ) -> AsyncGenerator[str, None]:
        
        # 1. Ethics Check (Identity + Ethics)
        is_safe, refusal = await self.ethics_service.check_integrity(prompt, user_id)
        if not is_safe:
            yield refusal
            self._log_interaction(user_id, session_id, prompt, refusal, InteractionType.CHAT, client_ref_id)
            return

        # 2. Context Retrieval (Memory + Knowledge)
        relevant_memories = await self.memory_service.search_relevant_context(user_id, prompt)
        
        # TODO: Phase 1 - Inject relevant Knowledge Graph nodes here
        # missing_concepts = await self.knowledge_service.find_missing_prerequisites(user_id, prompt_concept)
        
        context_str = "\n".join([f"- {m.content}" for m in relevant_memories])
        
        # 3. Construct System Prompt (Strict Injection Order)
        
        # Fetch user preferences
        user_obj = self.db.query(User).filter(User.id == user_id).first()
        lang_pref = "English"
        curr_pref = "General"
        career_context = ""
        style_context = ""
        
        if user_obj:
            if user_obj.profile:
                if user_obj.profile.preferred_language:
                    lang_pref = user_obj.profile.preferred_language
                
                # Phase 3: Career & Style Injection
                if user_obj.profile.learning_style:
                    style_context = f"Preferred Learning Style: {user_obj.profile.learning_style}."
                if user_obj.profile.career_goals:
                    # JSON list might be returned as list by SQLAlchemy if typed properly, or str if sqlite/raw
                    # Assuming list based on model definition
                    goals = user_obj.profile.career_goals
                    if isinstance(goals, list) and goals:
                         career_context = f"User Career Goals: {', '.join(goals)}. Relate concepts to these careers."
            
            if user_obj.curriculum:
                 curr_pref = user_obj.curriculum.name

        # Order: Identity -> Memory -> Knowledge -> Task Constraints -> Ethics
        system_instruction = self.ethics_service.construct_system_prompt(
            f"Relevant constraints/memories from user history:\n{context_str}\n{career_context}\n{style_context}",
            language=lang_pref,
            curriculum=curr_pref
        )
        
        if mode == "deterministic":
            system_instruction += "\nProvide a concise, factual answer without socratic questioning."
        elif mode == "socratic":
            system_instruction += "\nMODE: SOCRATIC. Do NOT answer the question directly. Ask a guiding question to help the student find the answer."
        elif mode == "mentor":
            system_instruction += "\nMODE: MENTOR. Act as a long-term academic and career mentor. Offer strategic advice, connect topics to the user's career goals, and encourage persistence."

        # 4. Generate Response (Stream)
        full_response = ""
        async for chunk in self.ai_service.generate_stream(
            prompt=prompt, 
            system_instruction=system_instruction
        ):
            full_response += chunk
            yield chunk

        # 5. Save to Memory (Governance)
        # Note: We let the memory service decide IF it should be saved based on importance.
        self._log_interaction(user_id, session_id, prompt, full_response, InteractionType.CHAT, client_ref_id)
        
        await self.memory_service.add_interaction_memory(
            user_id, prompt, full_response, "latest" 
        )

    def _log_interaction(self, user_id, session_id, input_text, output_text, current_type, client_ref_id=None):
        interaction = Interaction(
            user_id=user_id,
            session_id=session_id,
            user_input=input_text,
            ai_response=output_text,
            type=current_type,
            client_ref_id=client_ref_id
        )
        self.db.add(interaction)
        self.db.commit()
        return interaction

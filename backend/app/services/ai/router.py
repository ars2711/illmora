from typing import List, Dict, AsyncGenerator
from sqlalchemy.orm import Session
from app.services.ai.factory import AIFactory
from app.services.memory_service import MemoryService
from app.services.tools.research import ResearchService
from app.services.ethics.ethics_service import get_ethics_service
from app.models.sql_models import Interaction, InteractionType, User, MemoryType

class AIRouter:
    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIFactory.get_service()
        self.memory_service = MemoryService(db)
        self.ethics_service = get_ethics_service()
        self.research_service = ResearchService()

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
        
        # Build Context String
        # Distinguish between user memories and knowledge graph (RAG)
        context_str = ""
        rag_context = ""

        # Note: metadata_ field is used to avoid SQL conflict
        # Use simple string check for memory_type as enum might fail string comparison in some cases
        for m in relevant_memories:
            # Check for Knowledge Graph type
            is_kg = str(m.memory_type) == "knowledge_graph" or m.memory_type == MemoryType.KNOWLEDGE_GRAPH
            
            if is_kg:
                # Safely access metadata_
                source = "Unknown"
                if hasattr(m, "metadata_") and m.metadata_:
                    source = m.metadata_.get("filename", "Unknown")
                rag_context += f"- [SOURCE: {source}]\n{m.content}\n"
            else:
                context_str += f"- {m.content}\n"

        
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
            f"Relevant previous conversations:\n{context_str}\n\nRETRIEVED KNOWLEDGE (RAG):\n{rag_context}\n\nUser Context:\n{career_context}\n{style_context}",
            language=lang_pref,
            curriculum=curr_pref
        )
        
        if mode == "fast":
            system_instruction += "\nMODE: FAST. Provide concise, direct explanations. Omit lengthy introductions. Focus on speed and clarity. Do not use filler words."
        elif mode == "deep":
            system_instruction += "\nMODE: DEEP ACADEMIC. Provide rigorous, first-principles derivations. Include proofs, edge cases, and foundational theory. Use formal academic language. Break down complex topics into atomic concepts."
            system_instruction += "\nSTRUCTURE: You MUST start your response with a <thinking> block outlining your logical steps and a <concepts> block listing prerequisites. Then provide the main response."
            system_instruction += "\nExample: <thinking>1. Define term. 2. Derive formula.</thinking><concepts>Algebra, Calculus</concepts>\n[Main Content]"
        elif mode == "socratic":
            system_instruction += "\nMODE: SOCRATIC. Do NOT answer the question directly. Ask a guiding question to help the student find the answer. Force them to derive the answer step-by-step."
            system_instruction += "\nSTRUCTURE: Use <thinking> to plan the guiding question strategy."
        elif mode == "exam":
            system_instruction += "\nMODE: EXAM SIMULATION. GRADE the student's input strictly. Point out errors. Do not give the answer immediately. Use a marking rubric style. Be critical and precise."
            system_instruction += "\nSTRUCTURE: Use <thinking> to compare against the marking scheme."
        elif mode == "research":
            # Execute synchronous research (for now, simpler than async for this MVP step)
            # In a real async pipeline, we'd await this. Since execute_research_plan is async in definition but we are in async def, we await it.
            research_results = await self.research_service.execute_research_plan([prompt])
            system_instruction += f"\nMODE: RESEARCH ASSISTANT. You have access to external tools. Use the provided search results to answer the user's question. CITE YOUR SOURCES."
            system_instruction += f"\n\n[RESEARCH TOOL RESULTS]:\n{research_results}\n"
            system_instruction += "\nINSTRUCTIONS: Synthesize the above information. If the results are irrelevant, state that you could not find specific information but answer based on your general knowledge, clearly distinguishing between the two."
        
        # Turbo Feature: Deep Revision Injection
        # We instruct the AI to generate revision cards if it detects a learning opportunity
        system_instruction += "\n\nTOOL USE: If the user explicitly asks for flashcards, or if you detect a recurring mistake/weakness that needs spaced repetition, append a HIDDEN block at the end of your response:\n"
        system_instruction += "<revision_card>\n"
        system_instruction += '{"concept": "Concept Name", "front": "Question/Trap", "back": "Answer/Correction", "type": "flashcard"}\n'
        system_instruction += "</revision_card>\n"
        system_instruction += "Do not mention this block in the visible text."

        if mode == "deterministic": # Keep backward compatibility
            system_instruction += "\nProvide a concise, factual answer without socratic questioning."
        elif mode == "mentor":
            system_instruction += "\nMODE: MENTOR. You are the user's long-term academic and career mentor."
            if career_context:
                system_instruction += f"\nCONTEXT: {career_context}"
                system_instruction += "\nINSTRUCTION: Always relate the current topic back to the user's career goals. Explain why this concept matters for their future job. Provide real-world industry examples."
            else:
                system_instruction += "\nINSTRUCTION: The user has not set specific career goals yet. Encourage them to explore different paths. Relate concepts to general professional skills (problem-solving, critical thinking)."
            
            system_instruction += "\nTONE: Encouraging, strategic, big-picture oriented. Do not just solve the problem; explain its value."

        # 4. Generate Response (Stream)
        full_response = ""
        async for chunk in self.ai_service.generate_stream(
            prompt=prompt, 
            system_instruction=system_instruction
        ):
            full_response += chunk
            yield chunk

        # 5. Extract & Save Revision Cards (if any)
        if "<revision_card>" in full_response:
             try:
                import json
                import re
                from app.services.revision_engine import RevisionEngine
                
                # Extract all cards
                pattern = r"<revision_card>(.*?)</revision_card>"
                matches = re.findall(pattern, full_response, re.DOTALL)
                
                rev_engine = RevisionEngine(self.db)
                for match in matches:
                    try:
                        card_data = json.loads(match.strip())
                        rev_engine.create_card(
                            user_id=user_id,
                            concept=card_data.get("concept", "General"),
                            front=card_data.get("front", ""),
                            back=card_data.get("back", ""),
                            card_type=card_data.get("type", "flashcard")
                        )
                        # Optional: yield a system notification chunk?
                        # yield "\n[System: Flashcard created for efficient revision]"
                    except Exception as e:
                        print(f"Failed to parse card JSON: {e}")
             except Exception as e:
                 print(f"Revision engine error: {e}")

        # 6. Save to Memory (Governance)
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

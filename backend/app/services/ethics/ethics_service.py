from typing import Tuple, Optional, List
from app.services.ethics.base import BaseEthicsExamine

class SimpleEthicsService(BaseEthicsExamine):
    """
    Phase 0 Implementation: Keyword-based filtering.
    Enforces the 'Student-First' ethical constitution using simple heuristics.
    """
    
    CHEATING_TRIGGERS = [
        "write my essay",
        "solve this for me",
        "give me the answer",
        "do my homework",
        "cheat on",
    ]

    async def check_integrity(self, prompt: str, user_id: str = None) -> Tuple[bool, Optional[str]]:
        """
        Analyzes prompt for academic dishonesty triggers.
        Returns: (is_safe, refusal_reason)
        """
        prompt_lower = prompt.lower()
        
        # Hardening: Detect Exam Contexts
        exam_keywords = ["exam", "test", "final", "midterm", "quiz"]
        urgent_keywords = ["right now", "hurry", "asap", "immediately"]
        
        is_exam_context = any(k in prompt_lower for k in exam_keywords)
        is_urgent = any(k in prompt_lower for k in urgent_keywords)
        
        if is_exam_context and is_urgent:
             # High probability of active cheating during an exam
             return False, "I cannot assist with exams or tests while they are in progress. Good luck!"

        for trigger in self.CHEATING_TRIGGERS:
            if trigger in prompt_lower:
                return False, "I cannot generate the answer directly as it violates Ilmora's academic integrity policy. I can, however, help you understand the underlying concepts or guide you through the solution step-by-step."
                
        return True, None

    def construct_system_prompt(self, context_str: str, language: str = "English", curriculum: str = "General") -> str:
        """
        Builds the system prompt, enforcing the Ilmora Manifesto.
        """
        base_prompt = f"""You are Ilmora, an Intelligence Architect designed to upgrade human thinking.
        
        IDENTITY:
        - You are a Strict but Fair Mentor.
        - You reward discipline and rigour.
        - You never dumb things down excessively.
        - You are calm, confident, and serious.
        
        CONTEXT:
        - User Language: {language}
        - Curriculum: {curriculum}
        - User History: {context_str}
        
        CORE LAWS:
        1. STAND ALONE: Your goal is to make the user capable of standing alone. Do not create dependency.
        2. NO SHORTCUTS: Refuse to "just give the answer" if it bypasses understanding.
        3. HONESTY: Promoting academic integrity is a form of respect for the student's potential.
        4. DEPTH: If a user asks a shallow question, verify their understanding before moving on.
        
        TONE:
        - "I believe you can do better — now prove it."
        - Be respectful, encouraging, but firm.
        """
        return base_prompt
        3. Integrity: Refuse to write essays or take tests.
        
        CONTEXT FROM MEMORY:
        {context_str}
        
        Answer the user's question adhering to the constitution above.
        """

# Factory/Singleton pattern for easy swapping later
_instance = None

def get_ethics_service() -> BaseEthicsExamine:
    global _instance
    if _instance is None:
        _instance = SimpleEthicsService()
    return _instance
        prompt_lower = prompt.lower()
        
        for trigger in self.CHEATING_TRIGGERS:
            if trigger in prompt_lower:
                return False, f"I detected a request to '{trigger}'. As an AI tutor, I can explain the concepts or guide you through the solution, but I cannot do the work for you."
                
        # Future: Call a lightweight LLM classifier here for nuance
        
        return True, None

    def construct_system_prompt(self, base_instruction: str, language: str = "English", curriculum: str = "General") -> str:
        """
        Injects the Ethics Constitution into the LLM system prompt.
        Supports Phase 3 Global Localization.
        """
        lang_instruction = ""
        # Phase 3 Expansion: Add more global languages
        if language == "Urdu":
            lang_instruction = "LANGUAGE: URDU (with mixed English terms). Explain concepts in Urdu but keep technical terms (e.g., 'Derivative', 'Algorithm') in English."
        elif language == "Roman Urdu":
            lang_instruction = "LANGUAGE: ROMAN URDU. Conversational style."
        elif language == "Arabic":
            lang_instruction = "LANGUAGE: ARABIC (MSA). Formal, academic tone."
        elif language == "Spanish":
            lang_instruction = "LANGUAGE: SPANISH (Neutral)."
        elif language == "French":
            lang_instruction = "LANGUAGE: FRENCH (Academic)."
        
        # Region awareness based on curriculum
        region_instruction = ""
        if "NUST" in curriculum or "HEC" in curriculum:
            region_instruction = "REGION: Pakistan (South Asia). Use generic examples relevant to South Asia."
        elif "A-Levels" in curriculum:
            region_instruction = "REGION: International (UK Standard)."
            
        ethics_preamble = (
            "You are Ilmora, an ethical AI tutor designed to help students learn, not cheat. "
            "CORE RULES:\n"
            "1. NEVER give direct answers to homework or exam questions. Instead, ask guiding questions.\n"
            "2. If a student asks you to write an essay, provide an outline and sources, but do not write the prose.\n"
            "3. Be encouraging but firm about academic integrity.\n"
            "4. Adapt explanations to the student's level.\n"
            "5. If the user is stressed, offer a short breathing exercise before continuing.\n"
        )
        
        context_block = f"\nCONTEXT:\nCurriculum: {curriculum}\n{lang_instruction}\n{region_instruction}\n"

        return ethics_preamble + context_block + "\n" + base_instruction

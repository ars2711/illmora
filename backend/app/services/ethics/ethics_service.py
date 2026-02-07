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
        lang_instruction = ""
        if language == "Urdu":
            lang_instruction = "LANGUAGE: URDU (with mixed English terms). Explain concepts in Urdu but keep technical terms in English."
        elif language == "Roman Urdu":
            lang_instruction = "LANGUAGE: ROMAN URDU. Conversational style."
        elif language == "Arabic":
            lang_instruction = "LANGUAGE: ARABIC (MSA). Formal, academic tone."
        elif language == "Spanish":
            lang_instruction = "LANGUAGE: SPANISH (Neutral)."
        elif language == "French":
            lang_instruction = "LANGUAGE: FRENCH (Academic)."

        region_instruction = ""
        if "NUST" in curriculum or "HEC" in curriculum:
            region_instruction = "REGION: Pakistan (South Asia). Use examples relevant to South Asia."
        elif "A-Levels" in curriculum:
            region_instruction = "REGION: International (UK Standard)."

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
{lang_instruction}
{region_instruction}

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

# Factory/Singleton pattern for easy swapping later
_instance = None

def get_ethics_service() -> BaseEthicsExamine:
    global _instance
    if _instance is None:
        _instance = SimpleEthicsService()
    return _instance

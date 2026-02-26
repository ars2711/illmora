from typing import Tuple, Optional, List
from app.services.ethics.base import BaseEthicsExamine
from app.services.ai.factory import AIFactory

class SimpleEthicsService(BaseEthicsExamine):
    """
    Phase 2 Implementation: Hybrid Filter (Heuristic + AI).
    Enforces the 'Student-First' ethical constitution using keyword heuristics and LLM verification.
    """
    
    CHEATING_TRIGGERS = [
        "write my essay",
        "solve this for me",
        "give me the answer",
        "do my homework",
        "cheat on",
        "write a paper on",
        "complete this assignment",
    ]

    SUSPICIOUS_INDICATORS = [
        "due in",
        "worth 50%",
        "final exam",
        "quiz code",
        "paste this code",
        "fix my code",
        "no explanation",
        "just the code",
    ]

    async def check_integrity(self, prompt: str, user_id: str = None) -> Tuple[bool, Optional[str]]:
        """
        Analyzes prompt for academic dishonesty triggers.
        Returns: (is_safe, refusal_reason)
        """
        prompt_lower = prompt.lower()
        
        # 1. Hardening: critical keywords - Instant Block
        exam_keywords = ["exam", "test", "final", "midterm", "quiz"]
        urgent_keywords = ["right now", "hurry", "asap", "immediately", "seconds left"]
        
        is_exam_context = any(k in prompt_lower for k in exam_keywords)
        is_urgent = any(k in prompt_lower for k in urgent_keywords)
        
        if is_exam_context and is_urgent:
             return False, "I cannot assist with exams or tests while they are in progress. Good luck! Trust your preparation."

        # 2. Heuristic Filter - Fast Block
        for trigger in self.CHEATING_TRIGGERS:
            if trigger in prompt_lower:
                return False, "I cannot generate the answer directly as it violates Ilmora's academic integrity policy. I can, however, help you understand the underlying concepts or guide you through the solution step-by-step."

        # 3. AI Verification - Smart Check for Ambiguity
        # If indicators are present but not explicit triggers, use AI to classify intent.
        suspicious_count = sum(1 for ind in self.SUSPICIOUS_INDICATORS if ind in prompt_lower)
        
        if suspicious_count > 0 or len(prompt) > 200: 
            # Long prompts or suspicious ones get a second opinion
            return await self._verify_with_ai(prompt)
                
        return True, None

    async def _verify_with_ai(self, prompt: str) -> Tuple[bool, Optional[str]]:
        """
        Uses a lightweight LLM call to classify the intent of the prompt.
        """
        ai_service = AIFactory.get_service()
        system_prompt = """
        You are an Academic Integrity Officer. Classify the following student prompt.
        
        Categories:
        - CHEATING: Asking for direct answers to assignments/exams without effort. "Write this for me".
        - LEARNING: Asking for explanation, guidance, or help understanding a concept. "How do I start?"
        - BENIGN: Chatting, general knowledge, or low-stakes questions.
        
        If unsure, lean towards LEARNING.
        
        Output format: JSON
        {"category": "CHEATING" | "LEARNING" | "BENIGN", "reason": "brief reason"}
        """
        
        try:
            # We use a fast/cheap model call here if possible, but standard for now
            response = await ai_service.generate_response(
                prompt=f"Prompt to analyze: \"{prompt}\"",
                system_instruction=system_prompt
            )
            
            # Simple parsing (using string check to avoid JSON parse overhead/errors for now)
            if "CHEATING" in response.upper() and "\"CHEATING\"" in response.upper():
                 return False, "This request appears to be an attempt to bypass learning. I can guide you, but I cannot do the work for you."
            
            return True, None
        except Exception as e:
            # Fail open (allow) if AI check fails, log error
            print(f"Integrity Check Failed: {e}")
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

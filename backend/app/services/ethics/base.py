from abc import ABC, abstractmethod
from typing import Tuple, Optional

class BaseEthicsExamine(ABC):
    """
    Interface for the Ethics & Integrity Layer.
    Ensures that any implementation (Keyword, LLM, Hybrid) adheres to the same contract.
    """
    
    @abstractmethod
    async def check_integrity(self, prompt: str, user_id: str = None) -> Tuple[bool, Optional[str]]:
        """
        Analyze a prompt or interaction for ethical violations.
        
        Args:
            prompt: The user's input text.
            user_id: Optional user context for recidivism checks.
            
        Returns:
            Tuple[bool, str]: (is_safe, refusal_reason)
            - is_safe: True if the prompt is allowed.
            - refusal_reason: The explanation to give the user if denied. None if safe.
        """
    @abstractmethod
    def construct_system_prompt(self, context_str: str, language: str = "English", curriculum: str = "General") -> str:
        """
        Builds the system prompt, enforcing the ethical constitution.
        
        Args:
            context_str: RAG strings or memory context.
            language: Language preference (English/Urdu/Mixed).
            curriculum: Academic context.
        """
        pass

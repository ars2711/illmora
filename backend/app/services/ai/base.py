from abc import ABC, abstractmethod
from typing import List, Dict, Any, AsyncGenerator

class BaseLLMService(ABC):
    """
    Abstract base class for LLM services to ensure multi-model support.
    """

    @abstractmethod
    async def generate_response(
        self, 
        prompt: str, 
        context: List[Dict[str, str]] = [], 
        system_instruction: str = None
    ) -> str:
        """
        Generates a text response from the LLM.
        """
        pass

    @abstractmethod
    async def generate_stream(
        self, 
        prompt: str, 
        context: List[Dict[str, str]] = [], 
        system_instruction: str = None
    ) -> AsyncGenerator[str, None]:
        """
        Generates a streaming text response.
        """
        pass

    @abstractmethod
    async def get_embeddings(self, text: str) -> List[float]:
        """
        Generates vector embeddings for a given text.
        """
        pass

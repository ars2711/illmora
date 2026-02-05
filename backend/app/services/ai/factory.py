from app.services.ai.base import BaseLLMService
from app.services.ai.openai_service import OpenAIService
# import other services like AnthropicService or LocalLlamaService

class AIFactory:
    @staticmethod
    def get_service(provider: str = "openai") -> BaseLLMService:
        if provider == "openai":
            return OpenAIService()
        # elif provider == "anthropic":
        #     return AnthropicService()
        else:
            raise ValueError(f"Unknown AI provider: {provider}")

ai_service = AIFactory.get_service()

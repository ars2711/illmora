import openai
from typing import List, Dict, Any, AsyncGenerator
from app.core.config import settings
from app.services.ai.base import BaseLLMService

class OpenAIService(BaseLLMService):
    def __init__(self):
        openai.api_key = settings.OPENAI_API_KEY
        self.model = "gpt-4-turbo-preview" # Default model
        self.embedding_model = "text-embedding-3-small"

    async def generate_response(
        self, 
        prompt: str, 
        context: List[Dict[str, str]] = [], 
        system_instruction: str = "You represent Ilmora, a student-first AI tutor."
    ) -> str:
        messages = [{"role": "system", "content": system_instruction}]
        messages.extend(context)
        messages.append({"role": "user", "content": prompt})

        response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=messages,
            temperature=0.7,
        )
        return response.choices[0].message.content

    async def generate_stream(
        self, 
        prompt: str, 
        context: List[Dict[str, str]] = [], 
        system_instruction: str = "You represent Ilmora, a student-first AI tutor."
    ) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": system_instruction}]
        messages.extend(context)
        messages.append({"role": "user", "content": prompt})

        response = await openai.ChatCompletion.acreate(
            model=self.model,
            messages=messages,
            temperature=0.7,
            stream=True
        )
        
        async for chunk in response:
            content = chunk.choices[0].delta.get("content", "")
            if content:
                yield content

    async def get_embeddings(self, text: str) -> List[float]:
        text = text.replace("\n", " ")
        response = await openai.Embedding.acreate(
            input=[text], 
            model=self.embedding_model
        )
        return response["data"][0]["embedding"]

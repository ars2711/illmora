from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Ilmora"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "changeme"
    POSTGRES_DB: str = "ilmora_db"
    SQLALCHEMY_DATABASE_URI: str | None = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: str | None, values: dict[str, any]) -> any:
        if isinstance(v, str):
            return v
        return f"postgresql://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}/{values.get('POSTGRES_DB')}"

    # AI Config
    # Hardening: Support multiple providers (OpenAI, Azure, Anthropic, Local)
    MODEL_PROVIDER: str = "openai" 
    MODEL_NAME: str = "gpt-4-turbo-preview"
    OPENAI_API_KEY: str = ""
    
    # AR: Using path for now, in prod use env content directly
    FIREBASE_CREDENTIALS_PATH: str = "firebase-adminsdk.json"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

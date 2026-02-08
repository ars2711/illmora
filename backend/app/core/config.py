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
    
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # Passkey / WebAuthn
    PASSKEY_RP_ID: str = "localhost"
    PASSKEY_RP_NAME: str = "Ilmora"
    PASSKEY_ORIGIN: str = "http://localhost:3000"
    PASSKEY_TIMEOUT_MS: int = 60000

    FRONTEND_URL: str = "http://localhost:3000"

    # Admin signup TOTP
    ADMIN_TOTP_SECRET: str = ""

    # MFA
    MFA_ISSUER: str = "Ilmora"

    # Notifications
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_USE_TLS: bool = True

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""
    TWILIO_VOICE_NUMBER: str = ""
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

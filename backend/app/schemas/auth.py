from pydantic import BaseModel


class PasskeyEmailRequest(BaseModel):
    email: str


class PasskeyCredentialRequest(BaseModel):
    credential: dict


class PasskeyAuthVerifyRequest(BaseModel):
    email: str
    credential: dict


class PasskeyTokenResponse(BaseModel):
    token: str

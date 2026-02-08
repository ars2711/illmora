from pydantic import BaseModel
from typing import Optional, List


class PasskeyEmailRequest(BaseModel):
    email: str


class PasskeyCredentialRequest(BaseModel):
    credential: dict


class PasskeyAuthVerifyRequest(BaseModel):
    email: str
    credential: dict


class PasskeyTokenResponse(BaseModel):
    token: str


class OtpRequest(BaseModel):
    email: str
    channel: str


class OtpVerifyRequest(BaseModel):
    email: str
    channel: str
    code: str


class OtpResponse(BaseModel):
    status: str
    channel: str
    destination: Optional[str] = None
    token: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: str
    channel: str


class PasswordResetVerifyRequest(BaseModel):
    email: str
    channel: str
    code: str
    new_password: Optional[str] = None


class PasswordResetResponse(BaseModel):
    status: str
    channel: str
    destination: Optional[str] = None
    token: Optional[str] = None


class PasswordLoginRequest(BaseModel):
    email: str
    password: str


class PasswordSetRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str


class RegisterRequest(BaseModel):
    email: str
    role: str
    password: Optional[str] = None
    admin_code: Optional[str] = None


class RegisterResponse(BaseModel):
    token: str
    role: str


class MfaSetupResponse(BaseModel):
    secret: str
    otpauth_url: str


class MfaEnableRequest(BaseModel):
    code: str


class MfaChannelsRequest(BaseModel):
    channels: List[str]


class MfaRequest(BaseModel):
    email: str
    method: str


class MfaVerifyRequest(BaseModel):
    email: str
    method: str
    code: str

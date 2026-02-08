import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from webauthn import (
    generate_registration_options,
    generate_authentication_options,
    verify_registration_response,
    verify_authentication_response,
)
from webauthn.helpers import options_to_json
from webauthn.helpers.structs import (
    RegistrationCredential,
    AuthenticationCredential,
    PublicKeyCredentialDescriptor,
    PublicKeyCredentialType,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
)
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url

from app.api.dependencies import get_db, get_current_user
from app.core.config import settings
from app.models.sql_models import PasskeyCredential, User
from app.schemas.auth import (
    PasskeyEmailRequest,
    PasskeyCredentialRequest,
    PasskeyAuthVerifyRequest,
    PasskeyTokenResponse,
    OtpRequest,
    OtpVerifyRequest,
    OtpResponse,
    PasswordResetRequest,
    PasswordResetVerifyRequest,
    PasswordResetResponse,
    PasswordLoginRequest,
    PasswordSetRequest,
    RegisterRequest,
    RegisterResponse,
    MfaSetupResponse,
    MfaEnableRequest,
    MfaChannelsRequest,
    MfaRequest,
    MfaVerifyRequest,
)
from app.services.passkey_challenges import set_challenge, pop_challenge
from app.core.security import create_access_token, get_password_hash, verify_password
from app.services.cache_service import cache
import random
from app.services.notification_service import send_otp_code, send_reset_code
import pyotp

router = APIRouter()

OTP_TTL_SECONDS = 10 * 60
RESET_TTL_SECONDS = 15 * 60
OTP_CHANNELS = {"email", "sms", "whatsapp", "voice"}
MFA_CHANNELS = {"email", "sms", "whatsapp", "voice", "totp"}


def _get_user_by_email(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def _mask_destination(value: str) -> str:
    if "@" in value:
        local, domain = value.split("@", 1)
        return f"{local[:2]}***@{domain}"
    if len(value) <= 4:
        return "***"
    return f"***{value[-4:]}"


def _otp_cache_key(channel: str, email: str) -> str:
    return cache.generate_key("otp", channel=channel, email=email)


def _reset_cache_key(channel: str, email: str) -> str:
    return cache.generate_key("reset", channel=channel, email=email)


def _mfa_cache_key(method: str, email: str) -> str:
    return cache.generate_key("mfa", method=method, email=email)


def _validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password too short")


def _admin_code_valid(code: str) -> bool:
    if not settings.ADMIN_TOTP_SECRET:
        return False
    totp = pyotp.TOTP(settings.ADMIN_TOTP_SECRET)
    return totp.verify(code)


@router.post("/passkeys/register/options")
def passkey_register_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(PasskeyCredential).filter(
        PasskeyCredential.user_id == current_user.id
    ).all()
    exclude = [
        PublicKeyCredentialDescriptor(
            id=base64url_to_bytes(item.credential_id),
            type=PublicKeyCredentialType.PUBLIC_KEY,
        )
        for item in existing
    ]

    options = generate_registration_options(
        rp_id=settings.PASSKEY_RP_ID,
        rp_name=settings.PASSKEY_RP_NAME,
        user_id=current_user.id.encode("utf-8"),
        user_name=current_user.email,
        user_display_name=current_user.full_name or current_user.email,
        exclude_credentials=exclude,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED
        ),
    )

    options_dict = json.loads(options_to_json(options))
    set_challenge(f"register:{current_user.id}", options_dict["challenge"])
    return {"publicKey": options_dict}


@router.post("/passkeys/register/verify")
def passkey_register_verify(
    payload: PasskeyCredentialRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = pop_challenge(f"register:{current_user.id}")
    if not challenge:
        raise HTTPException(status_code=400, detail="Registration challenge expired")

    credential = RegistrationCredential.parse_raw(json.dumps(payload.credential))
    verification = verify_registration_response(
        credential=credential,
        expected_challenge=base64url_to_bytes(challenge),
        expected_origin=settings.PASSKEY_ORIGIN,
        expected_rp_id=settings.PASSKEY_RP_ID,
    )

    credential_id = bytes_to_base64url(verification.credential_id)
    existing = db.query(PasskeyCredential).filter(
        PasskeyCredential.credential_id == credential_id
    ).first()
    if existing:
        return {"status": "exists"}

    passkey = PasskeyCredential(
        user_id=current_user.id,
        credential_id=credential_id,
        public_key=bytes_to_base64url(verification.credential_public_key),
        sign_count=verification.sign_count,
        transports=None,
    )
    db.add(passkey)
    db.commit()
    return {"status": "ok"}


@router.post("/passkeys/authenticate/options")
def passkey_authenticate_options(
    payload: PasskeyEmailRequest,
    db: Session = Depends(get_db),
):
    user = _get_user_by_email(db, payload.email)
    credentials = db.query(PasskeyCredential).filter(
        PasskeyCredential.user_id == user.id
    ).all()
    if not credentials:
        raise HTTPException(status_code=404, detail="No passkeys registered")

    allow = [
        PublicKeyCredentialDescriptor(
            id=base64url_to_bytes(item.credential_id),
            type=PublicKeyCredentialType.PUBLIC_KEY,
        )
        for item in credentials
    ]

    options = generate_authentication_options(
        rp_id=settings.PASSKEY_RP_ID,
        allow_credentials=allow,
        user_verification=UserVerificationRequirement.PREFERRED,
        timeout=settings.PASSKEY_TIMEOUT_MS,
    )

    options_dict = json.loads(options_to_json(options))
    set_challenge(f"auth:{user.id}", options_dict["challenge"])
    return {"publicKey": options_dict}


@router.post("/passkeys/authenticate/verify", response_model=PasskeyTokenResponse)
def passkey_authenticate_verify(
    payload: PasskeyAuthVerifyRequest,
    db: Session = Depends(get_db),
):
    user = _get_user_by_email(db, payload.email)
    challenge = pop_challenge(f"auth:{user.id}")
    if not challenge:
        raise HTTPException(status_code=400, detail="Authentication challenge expired")

    credential = AuthenticationCredential.parse_raw(json.dumps(payload.credential))
    credential_id = bytes_to_base64url(credential.raw_id)
    passkey = db.query(PasskeyCredential).filter(
        PasskeyCredential.credential_id == credential_id
    ).first()
    if not passkey:
        raise HTTPException(status_code=404, detail="Passkey not found")

    verification = verify_authentication_response(
        credential=credential,
        expected_challenge=base64url_to_bytes(challenge),
        expected_origin=settings.PASSKEY_ORIGIN,
        expected_rp_id=settings.PASSKEY_RP_ID,
        credential_public_key=base64url_to_bytes(passkey.public_key),
        credential_current_sign_count=passkey.sign_count,
        require_user_verification=False,
    )

    passkey.sign_count = verification.new_sign_count
    passkey.last_used_at = datetime.utcnow()
    db.add(passkey)
    db.commit()

    token = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "name": user.full_name or user.email,
            "role": str(user.role) if user.role else None,
        }
    )
    return PasskeyTokenResponse(token=token)


@router.post("/register", response_model=RegisterResponse)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = payload.role
    if role in {"teacher", "educator"}:
        role = "educator"
    if role in {"student"}:
        role = "student"
    if role in {"admin", "institution_admin", "system_admin"}:
        if not payload.admin_code or not _admin_code_valid(payload.admin_code):
            raise HTTPException(status_code=403, detail="Admin code invalid")
        role = "institution_admin"
    if role not in {"student", "educator", "institution_admin", "system_admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")

    if payload.password:
        _validate_password(payload.password)
        hashed_password = get_password_hash(payload.password)
    else:
        hashed_password = None

    user = User(email=payload.email, full_name=None, role=role, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "name": user.full_name or user.email,
            "role": str(user.role) if user.role else None,
        }
    )
    return RegisterResponse(token=token, role=str(user.role))


@router.post("/otp/request", response_model=OtpResponse)
def otp_request(payload: OtpRequest, db: Session = Depends(get_db)):
    if payload.channel not in OTP_CHANNELS:
        raise HTTPException(status_code=400, detail="Unsupported OTP channel")

    user = _get_user_by_email(db, payload.email)
    profile = user.profile
    destination = payload.email
    if payload.channel in {"sms", "whatsapp", "voice"}:
        if not profile or not profile.phone_number:
            raise HTTPException(status_code=400, detail="Phone number not on file")
        destination = profile.phone_number
        if payload.channel == "whatsapp" and profile.whatsapp_number:
            destination = profile.whatsapp_number

    code = f"{random.randint(0, 999999):06d}"
    cache.set(_otp_cache_key(payload.channel, payload.email), {"code": code}, OTP_TTL_SECONDS)

    sent = send_otp_code(payload.channel, destination, code)
    if not sent:
        print(f"OTP ({payload.channel}) for {payload.email}: {code}")

    return OtpResponse(status="sent", channel=payload.channel, destination=_mask_destination(destination))


@router.post("/otp/verify", response_model=OtpResponse)
def otp_verify(payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    if payload.channel not in OTP_CHANNELS:
        raise HTTPException(status_code=400, detail="Unsupported OTP channel")

    user = _get_user_by_email(db, payload.email)
    cached = cache.get(_otp_cache_key(payload.channel, payload.email))
    if not cached or cached.get("code") != payload.code:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    cache.delete(_otp_cache_key(payload.channel, payload.email))
    token = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "name": user.full_name or user.email,
            "role": str(user.role) if user.role else None,
        }
    )
    return OtpResponse(status="verified", channel=payload.channel, token=token)


@router.post("/mfa/request", response_model=OtpResponse)
def mfa_request(payload: MfaRequest, db: Session = Depends(get_db)):
    if payload.method not in MFA_CHANNELS:
        raise HTTPException(status_code=400, detail="Unsupported MFA method")

    user = _get_user_by_email(db, payload.email)
    if payload.method not in (user.mfa_channels or []):
        raise HTTPException(status_code=403, detail="MFA method not enabled")
    if payload.method == "totp":
        return OtpResponse(status="totp_ready", channel="totp")

    profile = user.profile
    destination = payload.email
    if payload.method in {"sms", "whatsapp", "voice"}:
        if not profile or not profile.phone_number:
            raise HTTPException(status_code=400, detail="Phone number not on file")
        destination = profile.phone_number
        if payload.method == "whatsapp" and profile.whatsapp_number:
            destination = profile.whatsapp_number

    code = f"{random.randint(0, 999999):06d}"
    cache.set(_mfa_cache_key(payload.method, payload.email), {"code": code}, OTP_TTL_SECONDS)
    sent = send_otp_code(payload.method, destination, code)
    if not sent:
        print(f"MFA ({payload.method}) for {payload.email}: {code}")

    return OtpResponse(status="sent", channel=payload.method, destination=_mask_destination(destination))


@router.post("/mfa/verify", response_model=PasskeyTokenResponse)
def mfa_verify(payload: MfaVerifyRequest, db: Session = Depends(get_db)):
    if payload.method not in MFA_CHANNELS:
        raise HTTPException(status_code=400, detail="Unsupported MFA method")

    user = _get_user_by_email(db, payload.email)
    if payload.method not in (user.mfa_channels or []):
        raise HTTPException(status_code=403, detail="MFA method not enabled")
    if payload.method == "totp":
        if not user.mfa_totp_secret:
            raise HTTPException(status_code=400, detail="TOTP not set")
        totp = pyotp.TOTP(user.mfa_totp_secret)
        if not totp.verify(payload.code):
            raise HTTPException(status_code=400, detail="Invalid code")
    else:
        cached = cache.get(_mfa_cache_key(payload.method, payload.email))
        if not cached or cached.get("code") != payload.code:
            raise HTTPException(status_code=400, detail="Invalid or expired code")
        cache.delete(_mfa_cache_key(payload.method, payload.email))

    token = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "name": user.full_name or user.email,
            "role": str(user.role) if user.role else None,
        }
    )
    return PasskeyTokenResponse(token=token)


@router.post("/password/login", response_model=PasskeyTokenResponse)
def password_login(payload: PasswordLoginRequest, db: Session = Depends(get_db)):
    user = _get_user_by_email(db, payload.email)
    if not user.hashed_password:
        raise HTTPException(status_code=400, detail="Password login not enabled")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.mfa_enabled:
        raise HTTPException(
            status_code=403,
            detail={"code": "mfa_required", "methods": user.mfa_channels},
        )

    token = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "name": user.full_name or user.email,
            "role": str(user.role) if user.role else None,
        }
    )
    return PasskeyTokenResponse(token=token)


@router.post("/password/set", response_model=PasskeyTokenResponse)
def password_set(
    payload: PasswordSetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _validate_password(payload.new_password)

    if current_user.hashed_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Current password required")
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(status_code=401, detail="Current password invalid")

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()

    token = create_access_token(
        {
            "sub": current_user.id,
            "email": current_user.email,
            "name": current_user.full_name or current_user.email,
            "role": str(current_user.role) if current_user.role else None,
        }
    )
    return PasskeyTokenResponse(token=token)


@router.post("/mfa/totp/setup", response_model=MfaSetupResponse)
def mfa_totp_setup(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    secret = pyotp.random_base32()
    current_user.mfa_totp_secret = secret
    db.add(current_user)
    db.commit()

    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(
        name=current_user.email,
        issuer_name=settings.MFA_ISSUER,
    )
    return MfaSetupResponse(secret=secret, otpauth_url=otpauth_url)


@router.post("/mfa/totp/enable", response_model=OtpResponse)
def mfa_totp_enable(
    payload: MfaEnableRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.mfa_totp_secret:
        raise HTTPException(status_code=400, detail="TOTP not initialized")
    totp = pyotp.TOTP(current_user.mfa_totp_secret)
    if not totp.verify(payload.code):
        raise HTTPException(status_code=400, detail="Invalid code")

    current_user.mfa_enabled = True
    channels = set(current_user.mfa_channels or [])
    channels.add("totp")
    current_user.mfa_channels = list(channels)
    db.add(current_user)
    db.commit()
    return OtpResponse(status="enabled", channel="totp")


@router.post("/mfa/channels", response_model=OtpResponse)
def mfa_channels_update(
    payload: MfaChannelsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invalid = [c for c in payload.channels if c not in MFA_CHANNELS]
    if invalid:
        raise HTTPException(status_code=400, detail="Invalid MFA channels")
    current_user.mfa_channels = payload.channels
    current_user.mfa_enabled = len(payload.channels) > 0
    db.add(current_user)
    db.commit()
    return OtpResponse(status="updated", channel="mfa")


@router.post("/password/reset/request", response_model=PasswordResetResponse)
def password_reset_request(
    payload: PasswordResetRequest, db: Session = Depends(get_db)
):
    if payload.channel not in OTP_CHANNELS:
        raise HTTPException(status_code=400, detail="Unsupported reset channel")

    user = _get_user_by_email(db, payload.email)
    profile = user.profile
    destination = payload.email
    if payload.channel in {"sms", "whatsapp", "voice"}:
        if not profile or not profile.phone_number:
            raise HTTPException(status_code=400, detail="Phone number not on file")
        destination = profile.phone_number
        if payload.channel == "whatsapp" and profile.whatsapp_number:
            destination = profile.whatsapp_number

    code = f"{random.randint(0, 999999):06d}"
    cache.set(
        _reset_cache_key(payload.channel, payload.email),
        {"code": code},
        RESET_TTL_SECONDS,
    )

    sent = send_reset_code(payload.channel, destination, code)
    if not sent:
        print(f"RESET ({payload.channel}) for {payload.email}: {code}")

    return PasswordResetResponse(
        status="sent",
        channel=payload.channel,
        destination=_mask_destination(destination),
    )


@router.post("/password/reset/verify", response_model=PasswordResetResponse)
def password_reset_verify(
    payload: PasswordResetVerifyRequest, db: Session = Depends(get_db)
):
    if payload.channel not in OTP_CHANNELS:
        raise HTTPException(status_code=400, detail="Unsupported reset channel")

    user = _get_user_by_email(db, payload.email)
    cached = cache.get(_reset_cache_key(payload.channel, payload.email))
    if not cached or cached.get("code") != payload.code:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    cache.delete(_reset_cache_key(payload.channel, payload.email))
    if payload.new_password:
        _validate_password(payload.new_password)
        user.hashed_password = get_password_hash(payload.new_password)
        db.add(user)
        db.commit()
    token = create_access_token(
        {
            "sub": user.id,
            "email": user.email,
            "name": user.full_name or user.email,
            "role": str(user.role) if user.role else None,
        }
    )
    return PasswordResetResponse(
        status="verified",
        channel=payload.channel,
        token=token,
    )

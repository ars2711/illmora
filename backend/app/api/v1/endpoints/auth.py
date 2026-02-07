import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth
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
)
from app.services.passkey_challenges import set_challenge, pop_challenge

router = APIRouter()


def _get_user_by_email(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


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

    token = firebase_auth.create_custom_token(user.id).decode("utf-8")
    return PasskeyTokenResponse(token=token)

import logging
from email.message import EmailMessage
import smtplib
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, body: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_FROM:
        logger.warning("SMTP not configured; email not sent.")
        return False
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to_email
        msg.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as exc:
        logger.error("Email send failed: %s", exc)
        return False


def _twilio_client():
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio not configured; message not sent.")
        return None
    try:
        from twilio.rest import Client

        return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    except Exception as exc:
        logger.error("Twilio client init failed: %s", exc)
        return None


def _send_sms(to_number: str, body: str) -> bool:
    client = _twilio_client()
    if not client or not settings.TWILIO_FROM_NUMBER:
        return False
    try:
        client.messages.create(
            body=body,
            from_=settings.TWILIO_FROM_NUMBER,
            to=to_number,
        )
        return True
    except Exception as exc:
        logger.error("SMS send failed: %s", exc)
        return False


def _send_whatsapp(to_number: str, body: str) -> bool:
    client = _twilio_client()
    if not client or not settings.TWILIO_WHATSAPP_NUMBER:
        return False
    try:
        client.messages.create(
            body=body,
            from_=f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
            to=f"whatsapp:{to_number}",
        )
        return True
    except Exception as exc:
        logger.error("WhatsApp send failed: %s", exc)
        return False


def _send_voice(to_number: str, body: str) -> bool:
    client = _twilio_client()
    if not client or not settings.TWILIO_VOICE_NUMBER:
        return False
    try:
        client.calls.create(
            to=to_number,
            from_=settings.TWILIO_VOICE_NUMBER,
            twiml=f"<Response><Say>{body}</Say></Response>",
        )
        return True
    except Exception as exc:
        logger.error("Voice call failed: %s", exc)
        return False


def send_otp_code(channel: str, destination: str, code: str) -> bool:
    message = f"Your Ilmora code is {code}. It expires in 10 minutes."
    if channel == "email":
        return _send_email(destination, "Your Ilmora code", message)
    if channel == "sms":
        return _send_sms(destination, message)
    if channel == "whatsapp":
        return _send_whatsapp(destination, message)
    if channel == "voice":
        return _send_voice(destination, f"Your Ilmora code is {code}.")
    return False


def send_reset_code(channel: str, destination: str, code: str) -> bool:
    message = f"Your Ilmora reset code is {code}. It expires in 15 minutes."
    if channel == "email":
        return _send_email(destination, "Ilmora reset code", message)
    if channel == "sms":
        return _send_sms(destination, message)
    if channel == "whatsapp":
        return _send_whatsapp(destination, message)
    if channel == "voice":
        return _send_voice(destination, f"Your Ilmora reset code is {code}.")
    return False

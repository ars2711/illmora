import firebase_admin
from firebase_admin import credentials, auth
from app.core.config import settings
import os

def init_firebase():
    """
    Initializes the Firebase Admin SDK.
    Should be called at application startup.
    """
    try:
        # Check if already initialized to prevent errors on reload
        firebase_admin.get_app()
    except ValueError:
        # Not initialized
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin Initialized successfully.")
        else:
            print(f"WARNING: Firebase credentials not found at {cred_path}. Auth will fail.")

def verify_token(token: str) -> dict:
    """
    Verifies a Firebase ID token.
    Returns the decoded token dict if valid, raises exception otherwise.
    """
    # In development without credentials, you might want a bypass
    # if settings.ENVIRONMENT == "development" and token == "dev-token":
    #     return {"uid": "dev-user-id", "email": "dev@ilmora.edu"}
    
    decoded_token = auth.verify_id_token(token)
    return decoded_token

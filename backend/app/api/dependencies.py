from typing import Generator, Optional
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db.base_class import Base
from app.core.config import settings
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import verify_token
from app.models.sql_models import User, LearningProfile

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates the Bearer Token and retrieves the user from DB.
    Creates the user if they don't exist (First Login).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
    
    token = authorization.split(" ")[1]
    
    try:
        decoded = verify_token(token)
        uid = decoded.get("uid")
        email = decoded.get("email")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )

    # Check DB
    user = db.query(User).filter(User.id == uid).first()
    
    if not user:
        # JIT Provisioning
        user = User(
            id=uid,
            email=email,
            full_name=decoded.get("name", "Student")
        )
        # Create empty profile
        profile = LearningProfile(user_id=uid)
        
        db.add(user)
        db.add(profile)
        db.commit()
        db.refresh(user)
        
    return user

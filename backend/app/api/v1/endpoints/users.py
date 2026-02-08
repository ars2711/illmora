from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.sql_models import User, LearningProfile
from app.schemas.user import UserProfileUpdate, UserProfileResponse

router = APIRouter()

@router.put("/me/profile", response_model=UserProfileResponse)
def update_user_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the user's learning profile (Onboarding).
    """
    # Update User basic info
    if profile_data.full_name:
        current_user.full_name = profile_data.full_name
    if profile_data.curriculum_id:
        current_user.curriculum_id = profile_data.curriculum_id
        
    db.add(current_user)

    # Update or Create Learning Profile
    profile = db.query(LearningProfile).filter(LearningProfile.user_id == current_user.id).first()
    if not profile:
        profile = LearningProfile(user_id=current_user.id)
        db.add(profile)
    
    if profile_data.degree:
        profile.degree_program = profile_data.degree
    if profile_data.semester:
        profile.current_semester = profile_data.semester
    if profile_data.subjects:
        profile.curr_subjects = profile_data.subjects
    if profile_data.preferred_language:
        profile.preferred_language = profile_data.preferred_language
    if profile_data.learning_style:
        profile.learning_style = profile_data.learning_style
    if profile_data.career_goals:
        profile.career_goals = profile_data.career_goals
    if profile_data.archetype:
        profile.archetype = profile_data.archetype
    if profile_data.phone_number:
        profile.phone_number = profile_data.phone_number
    if profile_data.whatsapp_number:
        profile.whatsapp_number = profile_data.whatsapp_number

    db.commit()
    db.refresh(current_user)
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=str(current_user.role) if current_user.role else None,
        curriculum_id=current_user.curriculum_id,
        profile_completed=bool(profile.degree_program),
        archetype=profile.archetype,
        phone_number=profile.phone_number,
        whatsapp_number=profile.whatsapp_number
    )

@router.get("/me", response_model=UserProfileResponse)
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile_completed = False
    if current_user.profile and current_user.profile.degree_program:
        profile_completed = True
        
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=str(current_user.role) if current_user.role else None,
        curriculum_id=current_user.curriculum_id,
        profile_completed=profile_completed,
        archetype=current_user.profile.archetype if current_user.profile else None,
        phone_number=current_user.profile.phone_number if current_user.profile else None,
        whatsapp_number=current_user.profile.whatsapp_number if current_user.profile else None
    )

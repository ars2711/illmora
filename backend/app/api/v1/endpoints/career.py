from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.sql_models import User
from app.schemas.career import CareerRoadmapRequest, CareerRoadmapResponse
from app.services.ai.factory import AIFactory
from app.services.cache_service import cache

router = APIRouter()

@router.post("/roadmap", response_model=CareerRoadmapResponse)
async def generate_career_roadmap(
    request: CareerRoadmapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a personalized career roadmap based on the user's current curriculum
    and their stated career goals. Uses Redis Caching (24h).
    """
    
    # 1. Gather Context
    user_curriculum = "General Studies"
    if current_user.curriculum:
        user_curriculum = current_user.curriculum.name
        
    user_goals = []
    if current_user.profile and current_user.profile.career_goals:
        user_goals = current_user.profile.career_goals
        
    target = request.target_role if request.target_role else (user_goals[0] if user_goals else None)
    
    if not target:
        raise HTTPException(status_code=400, detail="Please set a career goal in your profile or provide one in the request.")

    # 2. Check Cache
    # Key includes curr_user status so if they change role/degree they get new roadmap
    cache_key = cache.generate_key("career:roadmap", user_id=current_user.id, target=target, curriculum=user_curriculum)
    cached_resp = cache.get(cache_key)
    if cached_resp:
        return cached_resp

    # 3. Construct Prompt for AI Agent
    system_prompt = (
        "You are an expert Career & Academic Advisor. "
        "Your goal is to bridge the gap between a student's current academic curriculum "
        "and their target industry role.\n"
        "Output format: Markdown with clear sections."
    )
    
    user_prompt = (
        f"I am a student currently studying {user_curriculum}. "
        f"My goal is to become a {target}. "
        "Create a strategic roadmap for me. "
        "1. Identify gaps in my likely university syllabus vs industry needs. "
        "2. Suggest 3 key extra-curricular technical skills I must master. "
        "3. Suggest a capstone project idea that combines my degree with this job."
    )
    
    # 4. Invoke AI Service
    ai_service = AIFactory.get_service()
    response_text = await ai_service.generate_response(
        prompt=user_prompt,
        system_instruction=system_prompt
    )
    
    # 5. Parse & Cache
    # In a real app, we'd force JSON output from the LLM or structure it better.
    
    result = CareerRoadmapResponse(
        roadmap_content=response_text,
        suggested_modules=["See roadmap for details"], 
        estimated_time="Variable"
    )
    
    # Cache for 24 hours
    cache.set(cache_key, result.model_dump(), ttl=86400)
    
    return result

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models import sql_models as models
from app.schemas import curriculum as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Curriculum])
def read_curricula(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
):
    """
    Retrieve all active curricula.
    """
    curricula = db.query(models.Curriculum).filter(models.Curriculum.is_active == True).offset(skip).limit(limit).all()
    return curricula

@router.post("/", response_model=schemas.Curriculum)
def create_curriculum(
    curriculum: schemas.CurriculumCreate,
    db: Session = Depends(deps.get_db),
    # current_user: models.User = Depends(deps.get_current_active_superuser), # Uncomment when admin auth is fully ready
):
    """
    Create new curriculum.
    """
    db_curriculum = db.query(models.Curriculum).filter(models.Curriculum.code == curriculum.code).first()
    if db_curriculum:
        raise HTTPException(status_code=400, detail="Curriculum code already registered")
        
    db_obj = models.Curriculum(
        code=curriculum.code,
        name=curriculum.name,
        description=curriculum.description,
        config=curriculum.config,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/seed", response_model=List[schemas.Curriculum])
def seed_default_curricula(
    db: Session = Depends(deps.get_db),
):
    """
    Seed default curricula (NUST, A-Levels, HEC, etc.)
    """
    defaults = [
        {
            "code": "nust_cs",
            "name": "NUST (CS/SE/Engineering)",
            "description": "NUST standard curriculum for computing and engineering disciplines.",
            "config": {
                "assessment_style": "conceptual_mcq",
                "difficulty_bias": 1.2,
                "ethics_level": "standard",
                "subjects": ["Calculus", "PF", "OOP", "DLD"]
            }
        },
        {
            "code": "hec_gen",
            "name": "HEC General (Universities)",
            "description": "Standard HEC curriculum followed by most Pakistani universities.",
            "config": {
                "assessment_style": "mixed",
                "difficulty_bias": 1.0,
                "ethics_level": "standard"
            }
        },
        {
            "code": "alevels",
            "name": "A-Levels (CIE)",
            "description": "Cambridge International syllabus.",
            "config": {
                "assessment_style": "structured_theory",
                "difficulty_bias": 1.1,
                "ethics_level": "strict"
            }
        },
         {
            "code": "fsc_ics",
            "name": "FSc / ICS (Intermediate)",
            "description": "Federal and Punjab Board Intermediate curriculum.",
            "config": {
                "assessment_style": "textbook_accurate", 
                "difficulty_bias": 0.9,
                "ethics_level": "standard"
            }
        }
    ]
    
    results = []
    for d in defaults:
        # Check if exists
        exists = db.query(models.Curriculum).filter(models.Curriculum.code == d["code"]).first()
        if not exists:
            db_obj = models.Curriculum(**d)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            results.append(db_obj)
        else:
            results.append(exists)
            
    return results

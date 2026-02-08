import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.config import settings
from app.models.sql_models import ClassRoom, ClassMembership, User
from app.schemas.teacher import ClassCreateRequest, ClassJoinRequest, ClassResponse

router = APIRouter()


def _generate_code(length: int = 8) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


def _build_join_url(code: str) -> str:
    return f"{settings.FRONTEND_URL}/teacher/join?code={code}"


@router.post("/classes", response_model=ClassResponse)
def create_class(
    payload: ClassCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {"educator", "institution_admin", "system_admin"}:
        raise HTTPException(status_code=403, detail="Only educators can create classes")

    join_code = _generate_code()
    while db.query(ClassRoom).filter(ClassRoom.join_code == join_code).first():
        join_code = _generate_code()

    class_room = ClassRoom(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
        join_code=join_code,
    )
    db.add(class_room)
    db.commit()
    db.refresh(class_room)

    return ClassResponse(
        id=class_room.id,
        name=class_room.name,
        description=class_room.description,
        join_code=class_room.join_code,
        join_url=_build_join_url(class_room.join_code),
        created_at=str(class_room.created_at),
    )


@router.get("/classes", response_model=list[ClassResponse])
def list_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {"educator", "institution_admin", "system_admin"}:
        raise HTTPException(status_code=403, detail="Only educators can view classes")

    classes = db.query(ClassRoom).filter(ClassRoom.owner_id == current_user.id).all()
    return [
        ClassResponse(
            id=item.id,
            name=item.name,
            description=item.description,
            join_code=item.join_code,
            join_url=_build_join_url(item.join_code),
            created_at=str(item.created_at),
        )
        for item in classes
    ]


@router.post("/classes/join", response_model=ClassResponse)
def join_class(
    payload: ClassJoinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    class_room = (
        db.query(ClassRoom).filter(ClassRoom.join_code == payload.code).first()
    )
    if not class_room:
        raise HTTPException(status_code=404, detail="Class not found")

    existing = (
        db.query(ClassMembership)
        .filter(
            ClassMembership.class_id == class_room.id,
            ClassMembership.user_id == current_user.id,
        )
        .first()
    )
    if not existing:
        membership = ClassMembership(
            class_id=class_room.id,
            user_id=current_user.id,
            role="student",
        )
        db.add(membership)
        db.commit()

    return ClassResponse(
        id=class_room.id,
        name=class_room.name,
        description=class_room.description,
        join_code=class_room.join_code,
        join_url=_build_join_url(class_room.join_code),
        created_at=str(class_room.created_at),
    )

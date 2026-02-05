from fastapi import APIRouter
from app.api.v1.endpoints import (
    users, 
    chat, 
    documents, 
    study_group, 
    feedback, 
    curriculum, 
    graph,
    admin,
    marketplace,
    integrations,
    webhooks,
    career
)

router = APIRouter()

router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(graph.router, prefix="/graph", tags=["graph"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(documents.router, prefix="/documents", tags=["documents"])
router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
router.include_router(curriculum.router, prefix="/curriculum", tags=["curriculum"])
router.include_router(study_group.router, prefix="/study-groups", tags=["study-groups"])
router.include_router(admin.router, prefix="/admin", tags=["admin"])
router.include_router(marketplace.router, prefix="/marketplace", tags=["marketplace"])
router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
router.include_router(career.router, prefix="/career", tags=["career"])
router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])





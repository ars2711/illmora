from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.sql_models import User
from app.services.ingestion import IngestionService
from pydantic import BaseModel

router = APIRouter()

class DocumentResponse(BaseModel):
    id: str
    title: str
    type: str
    created_at: str

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a document for analysis (Notes/Practice).
    Triggers text extraction and vectorization.
    """
    service = IngestionService(db)
    
    # Validation: File size/type?
    # Phase 1: Basic pdf/txt
    
    doc = await service.process_upload(file, current_user.id)
    
    # Update doc with user_id manually if not done in service init (Service took user_id in process_upload but model init logic?)
    # Let's check ingestion.py code again.
    # doc = Document(..., user_id=?) -- Wait, I didn't add user_id to Document init in ingestion.py!
    # I need to fix ingestion.py
    
from typing import List
from app.models.sql_models import Document

# ... (Previous imports)

# ... (Previous Upload Endpoint)

@router.get("/", response_model=List[DocumentResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all documents for the current user.
    """
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return [
        DocumentResponse(
            id=d.id,
            title=d.title,
            type=d.type,
            created_at=str(d.created_at)
        ) for d in docs
    ]

class NoteDetailResponse(BaseModel):
    id: str
    title: str
    content: str # content of the document/note
    
@router.get("/{doc_id}", response_model=NoteDetailResponse)
def get_document_detail(
    doc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get full content of a specific document/note.
    """
    doc = db.query(Document).filter(
        Document.id == doc_id, 
        Document.user_id == current_user.id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    return NoteDetailResponse(
        id=doc.id,
        title=doc.title,
        content=doc.content
    )


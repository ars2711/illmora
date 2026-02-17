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
    chunk_count: int = 0

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads a document for analysis (Notes/Practice).
    Triggers text extraction, chunking, and vectorization.
    """
    service = IngestionService(db)
    
    # Phase 1: Basic pdf/txt/docx/doc
    
    try:
        doc = await service.process_upload(file, current_user.id)
        # Convert to Pydantic model response
        return DocumentResponse(
            id=doc.id,
            title=doc.title,
            type=doc.type.value if hasattr(doc.type, 'value') else "text",
            created_at=doc.created_at.isoformat() if doc.created_at else "",
            chunk_count=len(doc.chunks) if doc.chunks else 0
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
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


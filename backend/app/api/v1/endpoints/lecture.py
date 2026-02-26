from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.base_class import get_db
from app.api.dependencies import get_current_user
import shutil
import os
import uuid
import logging
from pypdf import PdfReader
from docx import Document
from app.services.memory_service import MemoryService
from app.models.sql_models import User
from app.api.dependencies import SessionLocal

# For MVP, local storage
UPLOAD_DIR = "uploads/lectures"

router = APIRouter()

os.makedirs(UPLOAD_DIR, exist_ok=True)

def extract_text(file_path: str, file_ext: str) -> str:
    text = ""
    try:
        if file_ext == "pdf":
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif file_ext in ["docx", "doc"]:
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        elif file_ext == "txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
    except Exception as e:
        logging.error(f"Error extracting text from {file_path}: {e}")
        return ""
    return text # Return full text for embedding

async def process_rag_ingestion(file_path: str, filename: str, user_id: str):
    """
    Background Task: Encapsulates the RAG ingestion pipeline.
    Creates a dedicated DB session to avoid closed-session errors.
    """
    db = SessionLocal()
    try:
        file_ext = filename.split(".")[-1].lower()
        full_text = extract_text(file_path, file_ext)
        
        if not full_text: 
            return

        ms = MemoryService(db)
        await ms.ingest_document(
            user_id=user_id,
            content=full_text,
            metadata={"filename": filename, "type": "lecture_slide"}
        )
        logging.info(f"Successfully vectorized {filename} for user {user_id}")
            
    except Exception as e:
        logging.error(f"RAG Ingestion Failed for {filename}: {e}")
    finally:
        db.close()

@router.post("/ingest")
async def ingest_lecture_material(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    course_name: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lecture Intelligence Layer:
    Ingest PDFs/Docx/Slides, extract text, and generate a concept breakdown.
    Currently performs text extraction and returns a preview analysis.
    Future: Vector embedding + RAG.
    """
    file_id = str(uuid.uuid4())
    filename = file.filename
    file_ext = filename.split(".")[-1].lower()
    
    if file_ext not in ["pdf", "docx", "txt", "md"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or Text files.")

    safe_filename = f"{file_id}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
    
    # Extract text immediately for the response (MVP speed preview)
    # We re-extract here just for the preview, but full extraction happens in background for RAG
    preview_text = extract_text(file_path, file_ext)[:10000]
    
    if not preview_text:
        return {
             "status": "warning",
             "message": "File uploaded but no text could be extracted. It might be an image-based PDF.",
             "file_id": file_id
        }

    # Trigger RAG Ingestion in Background
    # We'll pass the task to background_tasks
    background_tasks.add_task(process_rag_ingestion, file_path, filename, current_user.id)

    # Lightweight 'intelligence' analysis (heuristic based for now to be fast)
    word_count = len(preview_text.split())
    complexity_score = min(100, int(word_count / 50)) 
    
    # Simple extraction of capitalized phrases as 'Key Concepts'
    import re
    potential_concepts = list(set(re.findall(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', preview_text)))[:5]

    return {
        "status": "success",
        "file_id": file_id,
        "message": f"Successfully ingested {filename} for {course_name}. RAG Indexing queued.",
        "analysis": {
             "detected_concepts": potential_concepts if potential_concepts else ["General Knowledge"],
             "complexity_score": f"{complexity_score}/100",
             "word_count": word_count,
             "preview": preview_text[:200] + "..."
        }
    }

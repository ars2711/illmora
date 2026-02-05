from fastapi import UploadFile, HTTPException
import shutil
import os
from typing import List
from uuid import uuid4
from sqlalchemy.orm import Session
from app.models.sql_models import Document, ContentType
from app.services.ai.factory import AIFactory
import logging

# Simple Ingestion Service for Phase 1
class IngestionService:
    UPLOAD_DIR = "uploads"
    
    def __init__(self, db: Session):
        self.db = db
        self.ai_service = AIFactory.get_service()
        if not os.path.exists(self.UPLOAD_DIR):
            os.makedirs(self.UPLOAD_DIR)

    async def process_upload(self, file: UploadFile, user_id: str) -> Document:
        # 1. Save File Locally
        file_ext = file.filename.split(".")[-1].lower()
        file_id = str(uuid4())
        safe_filename = f"{file_id}.{file_ext}"
        file_path = os.path.join(self.UPLOAD_DIR, safe_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            logging.error(f"File save failed: {e}")
            raise HTTPException(status_code=500, detail="Could not save file")

        # 2. Extract Text (Simplified for MVP)
        content_text = ""
        content_type = ContentType.TEXT
        
        try:
            if file_ext == "pdf":
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                for page in reader.pages:
                    content_text += page.extract_text() + "\n"
                content_type = ContentType.TEXT # We treat extracted text as TEXT type for now
            elif file_ext == "txt":
                with open(file_path, "r", encoding="utf-8") as f:
                    content_text = f.read()
            else:
                 content_text = f"[Binary File: {file.filename}]"
                 # TODO: Add DOCX/PPTX parsers
        except Exception as e:
            logging.warning(f"Text extraction failed: {e}")
            content_text = f"[Extraction Failed for {file.filename}]"

        # 3. Vectorize Summary (First 4000 chars for now)
        # Note: In real app, we'd chunk this into multiple Memory objects or DocumentChunks
        # For Phase 1 Notes Engine, we store the full text in Document
        
        embedding = await self.ai_service.get_embeddings(content_text[:4000] if content_text else "Empty")

        # 4. Save to DB
        doc = Document(
            id=file_id,
            user_id=user_id,
            title=file.filename,
            content=content_text,
            file_path=file_path,
            type=content_type,
            embedding=embedding
        )
        
        self.db.add(doc)
        self.db.commit()
        
        return doc

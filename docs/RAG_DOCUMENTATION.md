# Document RAG Engine Documentation

## Overview

Illmora now supports a Retrieval-Augmented Generation (RAG) pipeline that allows students to upload study materials (PDF, DOCX, TXT) and have the AI Tutor reference these documents during chats.

## Architecture

1.  **Ingestion Service** (`backend/app/services/ingestion.py`):
    - **Extraction**: Uses `pypdf` and `python-docx` to extract raw text.
    - **Chunking**: Splits text into 1000-character chunks with 200-char overlap using `RecursiveCharacterTextSplitter`.
    - **Vectorization**: Generates embeddings for each chunk using OpenAI `text-embedding-3-small`.
    - **Storage**: Saves `Document` (metadata) and `DocumentChunk` (vectors) to PostgreSQL.

2.  **Retrieval System** (`backend/app/services/memory_service.py`):
    - Hybrid retrieval queries both `memories` (episodic user history) and `document_chunks` (semantic knowledge).
    - Results are combined and fed into the AI context window.

3.  **Chat Integration** (`backend/app/services/ai/router.py`):
    - The `AIRouter` automatically pulls context from `MemoryService`.
    - No changes were needed in the Router logic; it simply consumes the enriched context.

## Usage

### Uploading Documents

POST `/api/v1/documents/upload`

- Form Data: `file` (PDF/DOCX/TXT)
- Header: `Authorization: Bearer <token>`

### Querying

Just chat with the AI!
"Explain vector calculus from my uploaded notes."
The system will find the relevant chunks from the uploaded "Calculus III Notes.pdf" and use them to answer.

## Database Schema

- **documents**: Stores original file metadata and raw content.
- **document_chunks**: Stores the 1536-dimensional vectors and text chunks.

## Future Improvements

- [ ] Multi-tenant isolation (already enforced by user_id).
- [ ] OCR for scanned PDFs.
- [ ] Citation tracking (returning source page numbers in chat).

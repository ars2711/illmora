# Ilmora: Student-First AI Learning Operating System

**Mission:** Create the world’s most powerful ethical AI learning operating system for students — starting from NUST, expanding to Pakistan, then globally.

## Core Principles

1.  **Explain, never just answer**: We build understanding, not homework completion bots.
2.  **Academic Integrity**: Architecture explicitly discourages cheating and shortcuts.
3.  **Offline-first**: Designed for low-bandwidth environments with robust sync capabilities.
4.  **Persistent Memory**: The system grows with the student, remembering past struggles and successes.
5.  **Mental Health & Growth**: Features designed to reduce anxiety and promote disciplined study habits.
6.  **Ethical Alignment**: Respectful, beneficial, and inclusive knowledge dissemination.

## Tech Stack

- **Frontend**: Next.js 14 (PWA)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (with pgvector)
- **Caching**: Redis (Rate Limiting, Marketplace Feed)
- **Auth**: Firebase
- **Infrastructure**: Docker Compose, Webhooks
- **Offline**: IndexedDB + Service Workers

## Phase 3: Global Platform (Completed Features)

*   **Multi-tenancy**: Institution-isolated data with `InstitutionAdmin` and `SystemAdmin` roles.
*   **Marketplace**: Buy/Sell Study Packs mechanism with content ownership verification.
*   **Career Intelligence**: AI Mentor mode that maps academic curriculum to industry career goals.
*   **Extensibility**: Webhook system for LMS and external tool integrations.
*   **Optimization**: Redis caching for high-traffic endpoints.

## Architecture Overview

The project follows a modular, scalable architecture separating the client-side PWA and the server-side AI orchestration layer.

### Directory Structure

- `/frontend`: Next.js application (PWA)
- `/backend`: FastAPI service for AI logic, Heavy Compute, and Data persistence
- `/docs`: Architectural documentation and decision logs

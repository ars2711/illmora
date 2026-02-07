# Ilmora

Ilmora is an ethical, student-first learning operating system. It blends an offline-ready PWA, memory graph intelligence, and a timeless studio experience that makes study feel like a live performance.

## Vision

- Explain, never just answer.
- Protect academic integrity and long-term mastery.
- Stay offline-first and resilient in low-bandwidth contexts.
- Build a persistent memory graph that grows with the learner.
- Keep the human in the loop with transparent, respectful AI.

## Product Highlights

- Immersive studio UI with ambient motion and tactile interactions.
- Memory graph workflows for concept linking, recall, and synthesis.
- Practice rituals with timed recall and Socratic prompts.
- PWA install support for desktop and mobile (offline-ready).
- Ethical alignment and privacy-respecting defaults.

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: FastAPI (Python)
- Database: PostgreSQL + pgvector
- Caching: Redis
- Auth: Firebase
- Infra: Docker Compose + Webhooks
- Offline: IndexedDB + Service Workers

## Repository Layout

- frontend: Next.js application (PWA)
- backend: FastAPI service for AI and persistence
- docs: Architecture decision records and notes

## Getting Started

### Frontend (Next.js)

From the repo root:

```powershell
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

### Backend (FastAPI)

From the repo root:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000.

## Environment Variables

- frontend/.env.local: Firebase keys, public site URL, and client config.
- backend/.env: database connection string, API keys, and service configuration.

## PWA Notes

PWA install prompts appear only when the browser determines the app is installable (HTTPS + service worker + manifest). In local development, install behavior can vary by browser.

## Contributing

Design and product direction are curated to keep Ilmora timeless and student-first. If you are contributing, prioritize clarity, accessibility, and respectful AI behavior.

## Credits

Ilmora Studio by Arsalan — building ethical learning systems for the long arc of mastery.

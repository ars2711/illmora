# ADR 001: Phase 0 Foundations & Architecture

**Date:** 2026-02-05
**Status:** Accepted

## Context

We are building ILMORA, a scale-first AI Learning OS. Phase 0 requires laying down a robust, scalable foundation that supports offline-first usage, academic integrity, and long-term memory, without implementing user-facing features yet.

## Decisions

### 1. Unified Database Schema (SQLAlchemy)

We chose a relational model using PostgreSQL + pgvector.

- **Why?** Relational data (User, Course, Interaction) mixes heavily with Vector data (Memories, Embeddings). Managing two DBs (SQL + VectorDB) introduces unnecessary complexity at this stage. `pgvector` allows ACID transactions across both standard data and embeddings.
- **Key Models:** `LearningProfile` (long-term stats), `Memory` (vectorized interactions), `KnowledgeNode` (graph concepts).

### 2. Offline-First via IndexedDB + Mutation Queue

We implemented a custom `SyncManager` on top of IndexedDB.

- **Why?** Standard service worker caching isn't enough for interactive chat. We need to queue user _actions_ (mutations) and replay them when online.
- **Mechanism:** `useOfflineChat` hook updates local state immediately (Optimistic UI), persists to IndexedDB, and adds a job to `pending-mutations` store.

### 3. Ethical Middleware Layer (`EthicsService`)

We implemented hard-coded checks before the LLM is even called.

- **Why?** Relying solely on the LLM's safety training is insufficient for specific academic integrity rules (e.g., "don't write the essay").
- **Flow:** User Prompt -> EthicsService (Regex/Keyword Check) -> AI Router.

### 4. Abstracted AI Router

We created an `AIRouter` facilitating RAG (Retrieval Augmented Generation).

- **Why?** To decouple the application logic from the specific LLM provider (OpenAI vs Anthropic vs Local).
- **Context Injection:** The router automatically fetches relevant `Memory` objects and injects them into the system prompt, ensuring the "Persistent Memory" pillar is met.

## Consequences

- **Positive:** System is ready for multi-model usage; offline logic is robust; database is single-source-of-truth.
- **Negative:** Complexity in the frontend sync logic (conflict resolution not fully implemented yet); Initial setup is verbose compared to a simple wrapper.

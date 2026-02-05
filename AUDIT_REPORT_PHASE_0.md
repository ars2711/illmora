# Phase 0 Audit & Hardening Report

**Date:** February 5, 2026
**Auditor:** GitHub Copilot (System Architect)
**Status:** PASSED (with hardened fixes applied)

## 1. Executive Summary

The "Foundation" phase of Ilmora has been audited. The core architecture (Next.js + FastAPI + Postgres + Firebase) is sound. Several critical weaknesses in the "happy path" logic were identified and hardened, specifically around:

1.  **Database Scalability**: Missing compound indexes on high-volume tables.
2.  **Offline Reliability**: Potential for "poison pill" messages blocking the sync queue forever.
3.  **Ethical Safety**: Lack of a formal interface for the ethics engine, making future upgrades risky.

These have been remediated. The system is now ready for Phase 1 feature development.

## 2. Weaknesses Identified & Fixed

### A. Database Scalability (Critical)

- **Issue**: `UserConceptMastery` table (linking Users to Knowledge Nodes) only had a primary key. As users multiplied against thousands of concepts, queries like "Get all my mastered concepts" would become slow table scans.
- **Fix**: Added `Index("ix_user_node_mastery", "user_id", "node_id", unique=True)` to `sql_models.py`. This ensures O(log N) lookups and data integrity.

### B. Offline Sync "Death Loop" (High)

- **Issue**: The `SyncManager` in `sync.ts` would retry _any_ failed request indefinitely. If a request was invalid (400 Bad Request), it would block the queue forever, stopping all future messages.
- **Fix**: Implemented status code discrimination.
  - **4xx Errors**: Logged warning and dropped immediately (Invalid).
  - **5xx/Network**: Keep in queue for retry (Transient).

### C. Ethics Coupling (Medium)

- **Issue**: The `EthicsService` was a standalone class with hardcoded lists. Replacing it with an LLM-based judge later would require refactoring the Router.
- **Fix**: Created `BaseEthicsExamine` abstract base class (interface). Refactored the keyword checker into `SimpleEthicsService` implementing this interface. The Router now depends on the abstraction, not the implementation.

### D. Model Agnosticism (Low)

- **Issue**: `OpenAI` was hardcoded in general config.
- **Fix**: Updated `config.py` to support `MODEL_PROVIDER` and `MODEL_NAME` pattern, allowing easier switch to Anthropic or Local LLMs in future.

## 3. Review of Core Pillars

| Pillar              | Status       | Notes                                                                                                               |
| :------------------ | :----------- | :------------------------------------------------------------------------------------------------------------------ |
| **Architecture**    | **Stable**   | FastAPI router pattern is clean. Dependencies are injected.                                                         |
| **Database**        | **Hardened** | Normalization is good. `pgvector` hooks are present.                                                                |
| **Memory**          | **Ready**    | RAG retrieval loop is implemented in `AIRouter`. Logic is sound.                                                    |
| **Knowledge Graph** | **Ready**    | Node/Edge schema supports Prerequisite/Dependency logic.                                                            |
| **Ethics**          | **Hardened** | Interface established. Prompt Injection defense is primitive (keyword) but architectural slot is ready for upgrade. |

## 4. Next Steps (Phase 1)

The foundation is boring and stable. You may now proceed to:

1.  **Ingest Content**: Populate `knowledge_nodes` with real data.
2.  **Refine RAG**: Tune the `search_relevant_context` similarity thresholds.
3.  **UI Polish**: Improve the graph visualization and chat UI.

**Signed,**
_System Architect_

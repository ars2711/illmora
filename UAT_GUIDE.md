# Phase 3 UAT Guide: Global Launch

**Version:** 1.0  
**Date:** February 6, 2026  
**Status:** Ready for Testing

This guide validates the global readiness of Ilmora, focusing on Multi-tenancy, Marketplace, and Advanced AI Intelligence.

---

## 1. Environment Setup

### A. Reset & Seed Data
Before testing, populate the database with the UAT scenario (NUST Institution, Mock Packs, Admin User).

1. **Start Backend**: Ensure Docker or local server is running.
2. **Trigger Seed**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/admin/seed/uat
   ```
   *Expected Output*: `{"status": "UAT Data Seeded", "institution": "National University of Sciences & Technology", ...}`

---

## 2. Testing Scenarios

### 🏢 Scenario A: Institution & Admin Control
**Goal**: Verify multi-tenant isolation and admin capabilities.

1. **Login as Admin**:
   * Navigate to `/admin/dashboard`.
   * *Verify*: You see "NUST" stats (Users, Interactions).
   * *Verify*: The "Flagged Issues" list is visible.
2. **Manage Integrations**:
   * Navigate to `/admin/integrations`.
   * *Action*: Click "Create" on the "LMS" tab.
   * *Fill*: Name="Moodle Test", Type="LMS".
   * *Verify*: The new integration appears in the list.

### 🛍️ Scenario B: Marketplace Econony
**Goal**: Verify content discovery and ownership.

1. **Browse Store**:
   * Navigate to `/marketplace`.
   * *Verify*: You see "DSA Finals" (PKR 500) and "Calculus II" (Free) packs.
2. **Content Details**:
   * Click "View Details".
   * *Verify*: Displays Rating (4.8), Author (Ali Topper), and Description.

### 🧠 Scenario C: Career Intelligence
**Goal**: Verify the new AI Mentor mode.

1. **Profile Setup**:
   * Navigate to `/onboarding`.
   * *Set*: Career Goal = "Software Architect".
   * *Set*: Learning Style = "Socratic".
2. **Generate Roadmap**:
   * Navigate to `/career`.
   * *Action*: Click "Generate Roadmap".
   * *Verify*: AI generates a structured markdown response with:
     *   Gap Analysis (University Syllabus vs Industry).
     *   Suggested extra-curriculars (e.g., Docker, System Design).
     *   Capstone Project Idea.
3. **Caching Check**:
   * *Action*: Refresh page or click "Generate" again immediately.
   * *Verify*: Response is instant (served from Redis Cache).

### 🌐 Scenario D: Webhooks (Extensibility)
**Goal**: Verify event dispatch (Simulated).

1. **View Hooks**:
   * Go to `/admin/integrations` -> "Webhooks" tab.
   * *Verify*: Pre-seeded hook for `alert.raised` exists.

---

## 3. Deployment Checklist (Phase 4)

- [ ] **Docker**: `docker-compose up --build` runs without errors.
- [ ] **Redis**: Connection established (Logs show "Redis Cache Initialized").
- [ ] **Database**: `pgvector` extension enabled.
- [ ] **Frontend**: All pages (`/marketplace`, `/career`, `/admin`) load without 404s.

---

**Sign-off**: ____________________ (QA Lead)

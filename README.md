# CubeTriggers

**CubeTriggers** is a local-first analytics application for **speedcubing algorithms**.

Its purpose is to **identify, quantify, and explore the most commonly used move triggers** (for example, `R U R' U'`) that actually appear in real-world algorithm sets, rather than relying on theory or anecdote.

Instead of asking *“What triggers should I practice?”*, CubeTriggers answers:

- Which 4-, 5-, and 6-move sequences are most frequently used?
- Which triggers dominate **F2L** vs **OLL** vs **PLL**?
- Which triggers are common across multiple sources?
- Where do specific triggers appear, and in which algorithms?

The result is a **data-driven practice guide** grounded in real algorithm usage.

---

## How CubeTriggers Works

CubeTriggers has three major responsibilities:

### 1. Ingestion & Normalization
Algorithm sources (text files, copied lists, etc.) are imported and tagged with:
- a **Source** (site or document)
- an **algorithm type** (F2L, OLL, PLL, etc.)

Each algorithm is then:
- tokenized
- normalized  
  - rotations (`x`, `y`, `z`) stripped  
  - wide moves normalized to `Rw` notation  
  - `2` and `'` preserved  
- deduplicated across sources

This ensures the same algorithm appearing in multiple places is treated as **one canonical algorithm with multiple occurrences**.

---

### 2. Analysis & Aggregation
Algorithms are processed asynchronously to extract all contiguous **n-grams** (typically 4–6 moves).

For each n-gram, CubeTriggers computes **materialized aggregates**, such as:
- total occurrence count
- number of distinct algorithms containing it (coverage)
- breakdowns by algorithm type and/or source

All analysis runs in the background so the user interface remains fast and responsive.

---

### 3. Exploration & Practice
The GUI allows users to:
- filter triggers by:
  - n-gram length
  - algorithm type (e.g. F2L only)
  - source
- view the most common triggers under those constraints
- drill into a trigger to see:
  - which algorithms contain it
  - which sources it appears in

The end goal is to surface **high-value triggers worth practicing**, backed by real data.

---

## Architecture Overview

CubeTriggers is intentionally built as **two tightly-coupled applications in a single monorepo**.

### Monorepo Structure
```
cube-triggers/
  server/   # Backend API and analysis engine
  web/      # Frontend GUI
```

They live together because:
- the GraphQL schema is a shared contract
- backend and frontend evolve together
- local development is simpler and faster

---

## Backend (`server/`)

The backend is responsible for **truth, analysis, and coordination**.

### Core Technologies
- **NestJS**  
  Application framework providing structure, dependency injection, and modularity.

- **GraphQL (code-first)**  
  The API layer, chosen because CubeTriggers queries are inherently multidimensional and filter-heavy.

- **PostgreSQL**  
  The primary data store, chosen for relational provenance tracking and predictable analytics.

- **Prisma (v7)**  
  Database toolkit providing schema-first modeling, migrations, and a type-safe client.

- **Redis + BullMQ (inline processor)**  
  Background job processing for ingestion, tokenization, n-gram extraction, and aggregate recomputation.

- **GraphQL Subscriptions**  
  Used to stream import progress and job status updates to the frontend in real time.

### Key Backend Concepts
- canonical algorithms deduplicated across sources
- algorithm occurrences for provenance tracking
- materialized n-gram aggregates for fast queries
- import runs for async job tracking

---

## Frontend (`web/`)

The frontend focuses on **exploration and insight**, not analysis.

### Core Technologies
- **React (Vite)**  
  Fast local development with minimal framework overhead.

- **Apollo Client**  
  GraphQL client for queries, mutations, and subscriptions.

### Responsibilities
- trigger import workflows
- filtering and ranking n-grams
- displaying aggregate statistics
- reacting to live backend updates via subscriptions

The frontend performs no heavy computation — it simply explores data prepared by the backend.

---

## Local Development

CubeTriggers is designed to run entirely on a local machine.

- **Docker Compose** provides:
  - PostgreSQL
  - Redis
- Node processes run locally for fast iteration
- A single command (`pnpm dev`) brings up the full stack

---

## Summary

> **CubeTriggers is a local, data-driven tool for analyzing real-world speedcubing algorithms to discover the most commonly used move triggers, built with NestJS, GraphQL, Prisma, PostgreSQL, Redis/BullMQ, and a React (Vite) frontend in a single monorepo.**

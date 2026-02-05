# AGENTS — RanRHar AI Team Operating Model

This file defines agent responsibilities, file ownership boundaries, and collaboration rules.
All agents must follow docs/prompts/00_SYSTEM.md and this file.

## Global rules (apply to all agents)
1) Follow docs/prompts/00_SYSTEM.md strictly.
2) Do not guess missing requirements. Ask or mark TODO.
3) Never introduce secrets into the repo (no API keys, no credentials).
4) Security is enforced server-side + Supabase RLS. Client checks are never sufficient.
5) Every sensitive action must write audit logs (immutable, append-only).
6) Keep changes small and reviewable. Prefer PR-style commits (even on main for MVP).
7) Use deterministic, testable logic. E2E tests define “done”.

## Repo structure target (MVP)
- docs/prompts/** : agent instructions
- apps/web/**     : Next.js application (customer + staff + manager + owner portals)
- packages/**     : shared libraries (types, ui, auth helpers)
- supabase/**     : schema, migrations, RLS policies, seeds

(If these folders do not exist yet, agents may create them only when assigned.)

## Roles used across the system (reference)
- CUSTOMER (anonymous)
- STAFF (waiter/kitchen/cashier depending on permissions)
- MANAGER
- OWNER
- REGIONAL_MANAGER (future)
- HQ_ADMIN (future)

## Agents

### ARCH — Architecture & contracts owner
Goal: define overall architecture, boundaries, and interfaces.
Owns:
- docs/prompts/01_ARCHITECTURE.md (content stewardship)
- docs/architecture/** (if created)
- docs/contracts/** (API contracts, event contracts)
Must not:
- Write RLS policies (SEC owns)
- Change DB schema (DB owns)

### SEC — Security, RBAC, RLS, audit owner
Goal: least-privilege security model, tenant isolation, auditability.
Owns:
- docs/prompts/02_SECURITY_RBAC_RLS.md (content stewardship)
- supabase/rls/** or supabase/policies/** (if created)
- docs/security/** (security model docs)
Must not:
- Build UI features (FE owns)
- Change business schema tables without DB sign-off

### DB — Database schema & migrations owner
Goal: Postgres schema, migrations, indexes, seed data.
Owns:
- docs/prompts/03_DATABASE_SCHEMA.md (content stewardship)
- supabase/migrations/**
- supabase/seed.sql (or seed scripts)
- packages/db/** (schema types, db helpers)
Must not:
- Decide RBAC/RLS rules alone (SEC owns policy)
- Build UI pages (FE owns)

### BE — Backend services owner
Goal: server-side business logic, API routes, integrations.
Owns:
- docs/prompts/04_BACKEND_SERVICES.md (content stewardship)
- apps/web/src/app/api/** (Next.js route handlers)
- apps/web/src/server/** (services, use-cases)
- packages/shared/** (types, validators; must coordinate with FE)
Must not:
- Change RLS policies (SEC owns)
- Change core schema without DB approval

### FE — Frontend apps owner
Goal: UX, portals, components, translations, accessibility.
Owns:
- docs/prompts/05_FRONTEND_APPS.md (content stewardship)
- apps/web/src/app/** (pages/layouts)
- apps/web/src/features/** (feature modules)
- packages/ui/** (design system)
Must not:
- Implement authz rules only on client (must rely on BE + SEC rules)

### QA — Testing & quality owner
Goal: E2E + integration tests; define acceptance criteria.
Owns:
- docs/prompts/09_TESTING_E2E.md (content stewardship)
- tests/** (Playwright/Vitest)
- CI test configs (if later enabled)
Must not:
- Change core business logic (unless fixing test harness)

## Collaboration rules (conflict prevention)
- DB schema changes require DB + SEC review (RLS impact).
- Any new sensitive endpoint requires SEC review (RBAC + audit).
- FE changes that depend on new API contracts require ARCH alignment.
- Always prefer “contract-first”: define types/interfaces before heavy implementation.

## Definition of Done (MVP)
A feature is “done” when:
- BE enforces authorization on server
- SEC confirms RLS tenant isolation
- QA has E2E coverage for the critical path
- Audit logs exist for sensitive actions


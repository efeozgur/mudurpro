# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MudurPro is a Turkish court case-file management system for Yazı İşleri Müdürlüğü (Court Clerk Director offices). It has a NestJS backend, React frontend, and PostgreSQL database. The system is multi-tenant: each courthouse (adliye) gets its own database schema.

## Commands

### Backend (`backend/`)

```bash
npm run start:dev   # NestJS dev server with hot reload (port 3000)
npm run build       # Compile TypeScript
npm run start:prod  # Run compiled JS from dist/
npm run seed        # Seed database with demo data (SUPER_ADMIN, courthouse, court, case, parties)
npm run test        # Run Jest unit tests (files matching *.spec.ts)
npm run test:e2e    # Run E2E tests
```

### Frontend (`frontend/`)

```bash
npm run dev    # Vite dev server with HMR (proxies /api → localhost:3000)
npm run build  # TypeScript check + Vite production build
npm run lint   # oxlint
```

### Docker

```bash
cd docker && docker compose up   # Starts: postgres:16, pgAdmin, backend (port 3000), frontend (port 8080 via nginx)
```

### Running a single test

```bash
cd backend && npx jest --testPathPattern=sure-engine
```

## Architecture

### Multi-Tenant Schema Isolation

The system uses PostgreSQL **schema-per-tenant** isolation. Shared tables (users, courthouses) live in the `public` schema. Tenant data (case_files, parties, service_records, appeals, fee_tracking, notifications, audit_logs, courts, user_courts) lives in per-courthouse schemas like `courthouse_istanbul`.

`TenantInterceptor` runs on every request: it reads the authenticated user's `courthouse_id`, looks up the courthouse's `schema_name`, and runs `SET search_path TO "schema_name", public` — so all subsequent TypeORM queries in that request hit the correct tenant schema automatically. SUPER_ADMIN users skip this (they see public schema only).

When creating a new courthouse via `CourthouseService.create()`, it generates a unique `schema_name`, inserts the courthouse row, then calls `TenantService.createTenantSchema()` to create the schema + all tenant tables via raw SQL.

### Backend (NestJS)

**Module structure** — each feature is under `backend/src/modules/<module>/`:
- `entities/` — TypeORM entity classes (all extend `BaseEntity` from `common/entities/base.entity`)
- `dto/` — class-validator DTOs for create/update
- `<module>.controller.ts` — route handlers
- `<module>.service.ts` — business logic
- `<module>.module.ts` — NestJS module definition

**Existing modules**: `auth`, `tenant`, `courthouse`, `court`, `case-file`, `party`, `service-record`, `appeal`, `fee-tracking`, `sure-engine`, `notification`, `audit-log`, `dashboard`

**Global infrastructure** (wired in `AppModule`):
- `ValidationPipe` with `whitelist: true, transform: true` — strips unknown fields, auto-transforms types
- `ResponseTransformInterceptor` — wraps all responses as `{ success: true, data, message: null }`
- `AuditLogInterceptor` — automatically logs all non-GET mutations to tenant's `audit_logs` table
- API prefix: `api/v1`

**Authentication & Authorization**:
- JWT strategy (`passport-jwt`) with `JwtAuthGuard` extending `AuthGuard('jwt')`
- Role-based access: `@Roles('SUPER_ADMIN', 'ADLIYE_ADMIN')` decorator + `RolesGuard`
- Three roles: `SUPER_ADMIN` (global, no courthouse), `ADLIYE_ADMIN` (courthouse-scoped admin), `MUDUR` (court clerk manager, single court)
- `@CurrentUser()` param decorator extracts `{ id, email, role, courthouseId }` from JWT payload

**BaseEntity** (all entities extend this):
- `id` — UUID primary key
- `created_at`, `updated_at` — timestamptz
- `deleted_at` — soft delete (nullable timestamptz, TypeORM `@DeleteDateColumn`)
- `created_by`, `updated_by` — UUID audit fields

**Database**: TypeORM with `synchronize: true` (auto-sync entities in dev). Note: tenant tables are NOT managed by TypeORM entities — they are created via raw SQL in `TenantService.createTenantSchema()`. Only public-schema tables (users, courthouses) have TypeORM entity classes with decorators. Tenant data entities (CaseFile, Party, etc.) do have entity classes but they rely on the runtime search_path for schema routing.

### Frontend (React)

**Stack**: React 19, TypeScript 6, Vite 8, Tailwind CSS 4, TanStack React Query, react-hook-form + zod, react-router-dom v7, lucide-react icons, Base UI primitives

**Routing** (`App.tsx`):
- `/login` — public login page
- `/` → redirects to `/dashboard`
- Everything under `AppLayout` (protected by auth check, renders `<Sidebar>` + `<Header>` + `<Outlet>`)
- Pages: dashboard, cases (list), case-detail (`/cases/:id`), courthouses, courts, users, notifications, audit

**State management**:
- Server state: TanStack React Query (`QueryClientProvider`, default `staleTime: 30s`, `retry: 1`)
- Auth state: React context (`AuthProvider` in `lib/auth.tsx`) — stores user object, exposes `login()`, `logout()`. Persists JWT in `localStorage('access_token')`

**API layer** (`lib/api-client.ts`):
- Axios instance with `baseURL: '/api/v1'`
- Request interceptor attaches `Bearer <token>` from localStorage
- Response interceptor: on 401, clears token and redirects to `/login`
- Vite dev server proxies `/api` → `http://localhost:3000` (backend)

**Sidebar** (`components/layout/sidebar.tsx`):
- Role-based navigation: each nav item has a `roles` array — only shown if user's role matches
- `SUPER_ADMIN`: Dashboard, Notifications, Audit, Courthouses, Courts, Users
- `ADLIYE_ADMIN`: same minus courthouses
- `MUDUR`: Dashboard, Cases, Notifications, Audit

**Component conventions**:
- UI primitives in `components/ui/` (button, input, card, table, dialog, badge, tabs, select, popover, tooltip, calendar, sheet, dropdown-menu, avatar, form)
- Shared components in `components/shared/` (loading-spinner, empty-state, confirm-dialog, status-badge, data-table)
- Page-specific components in `components/<feature>/` (e.g., `case-file/case-file-form`, `party/party-list`)
- Pages in `pages/`
- Path alias `@/` maps to `src/`

### Seed Data

`npm run seed` creates:
- SUPER_ADMIN user: `admin@ozgurapp.com` / `admin123`
- Demo courthouse "İstanbul Çağlayan Adliyesi" with schema `courthouse_istanbul`
- MUDUR user: `mudur@ozgurapp.com` / `admin123`
- All tenant tables in the schema
- Demo court "1. Asliye Hukuk Mahkemesi"
- Demo case file "2026/1" with two parties (plaintiff Ahmet Yılmaz, defendant Mehmet Kaya)

### Key Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (default: `postgresql://mudurpro:mudurpro_secret@localhost:5433/mudurpro`)
- `JWT_SECRET` — JWT signing secret (default: `dev-secret-change-me`)

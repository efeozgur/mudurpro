### Task 3.1: Courthouse CRUD — Complete

**Status:** Done  
**Commit SHA:** `cfdf3b9`  
**Date:** 2026-07-19

### Files Created

| File | Description |
|------|-------------|
| `backend/src/modules/courthouse/courthouse.module.ts` | Standard NestJS module, imports TypeOrmModule.forFeature([Courthouse]) |
| `backend/src/modules/courthouse/courthouse.controller.ts` | REST controller — GET/POST/PUT on `/courthouses`, JwtAuthGuard + RolesGuard, SUPER_ADMIN only |
| `backend/src/modules/courthouse/courthouse.service.ts` | CRUD service — findAll/create/update, create also triggers tenant schema creation |
| `backend/src/modules/courthouse/dto/create-courthouse.dto.ts` | name (required, max 200), city (optional, max 100) |
| `backend/src/modules/courthouse/dto/update-courthouse.dto.ts` | PartialType of Create + active (optional boolean) |

### Additional Changes

- `backend/src/app.module.ts` — Registered CourthouseModule in imports
- `backend/package.json` / `backend/package-lock.json` — Added `@nestjs/mapped-types` dependency

### Build

`npm run build` — passed with 0 errors.

### Summary

Created the Courthouse CRUD module with three endpoints (GET, POST, PUT) protected by JWT authentication and SUPER_ADMIN role guard. The service auto-generates a `courthouse_{timestamp}` schema name and delegates tenant schema DDL creation to TenantService.

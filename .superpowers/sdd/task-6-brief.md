### Task 2.2: Tenant Service & Schema Creation

Read the FULL code from the plan file:
`docs/superpowers/plans/2026-07-19-yazi-isleri-muduru-implementation.md`
Lines 869 to ~1170 (Task 2.2 section — through the end of tenant.interceptor.ts).

**Files to create:**
1. `backend/src/modules/tenant/entities/courthouse.entity.ts` — Courthouse entity (public schema, extends BaseEntity)
2. `backend/src/modules/tenant/tenant.service.ts` — TenantService with createTenantSchema(schemaName) method that runs SQL to create schema + all 9 tables (courts, user_courts, case_files, parties, service_records, appeals, fee_tracking, notifications, audit_logs) + indexes
3. `backend/src/modules/tenant/tenant.module.ts` — @Global() module exporting TenantService
4. `backend/src/common/interceptors/tenant.interceptor.ts` — Interceptor that sets search_path based on user's courthouse

**Key requirements:**
- Courthouse entity in `public` schema with schema_name (unique), name, city, active
- TenantService uses AppDataSource from data-source.ts to create schemas
- All tables use: UUID PK (gen_random_uuid()), ON DELETE RESTRICT, created_at/updated_at/deleted_at timestamps
- Indexes: case_files(court_id), case_files(esas_no), parties(case_file_id), service_records(case_file_id), service_records(status), audit_logs(user_id, created_at), notifications(user_id, status)
- TenantModule: @Global() so it's available everywhere
- TenantInterceptor: skips for SUPER_ADMIN on /api/v1/courthouses routes, sets search_path for other users

**After implementation:**
- Run `npm run build` in backend/
- Commit: `feat: add TenantService for dynamic schema creation + TenantInterceptor`

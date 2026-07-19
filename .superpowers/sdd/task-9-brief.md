### Batch Task: Engine Services (Tasks 5.1-5.4)

Create 4 self-contained backend modules. Follow NestJS pattern.

**1. SureEngine (Task 5.1)**
Dir: backend/src/modules/sure-engine/
File: sure-engine.module.ts, sure-engine.service.ts

SureEngineService methods:
- `calculateSures(caseFileId: string)` — core method, returns: `{ status: string, remainingDays?: number, finalizationDate?: string }`
- `getKritikSures()` — returns all case files with urgent/expired deadlines for current tenant

Core algorithm (pseudocode):
```
1. Get case_file, all active parties, all service records
2. Filter only SERVED service records
3. Get latest served_date from SERVED records
4. Check if ALL active parties have been served → if not, return 'PENDING_SERVICES'
5. Check for appeals:
   a. If no appeals → kesinleşme: 14 days from last served
   b. If appeals exist → get opposing parties, check all served → 14 days from last served → 'READY_FOR_APPEAL_TRANSFER'
6. Calculate fee deadlines:
   a. For each fee with status 'WAITING_PAYMENT': check payment_due_date
   b. If past due → advance to 'MUZEKKERE_REQUIRED'
7. Return status with remaining days
```

Urgency levels:
- remaining <= 0: 'GECMIS' (critical, red)
- remaining 1-3: 'KRITIK' (red)
- remaining 4-7: 'YAKLASIYOR' (amber)
- remaining 8-14: 'TAKIP' (yellow)
- remaining > 14: 'NORMAL' (green)

**2. Notification Engine (Task 5.2)**
Dir: backend/src/modules/notification/
Files: notification.module.ts, notification.controller.ts, notification.service.ts, dto/, entities/notification.entity.ts

Notification entity: user_id, case_file_id, type, priority (P1-P4), title, description, status (CREATED/UNREAD/READ/COMPLETED/ARCHIVED), read_at, completed_at

Service:
- `createNotification(userId, data)` — idempotent: check for existing notification of same type+file+user before creating
- `findByUser(userId, filters)` — paginated, filterable by type/priority/status
- `markRead(id)`, `markComplete(id)`
- `generateFromSureEngine(caseFileId, result)` — called by SureEngine, creates appropriate notifications

Controller:
- GET /api/v1/notifications (for current user)
- GET /api/v1/notifications/unread
- PATCH /api/v1/notifications/:id/read
- PATCH /api/v1/notifications/:id/complete

**3. Audit Log (Task 5.3)**
Dir: backend/src/modules/audit-log/
Files: module, controller, service, entity, interceptor

AuditLog entity (no BaseEntity — immutable): id (UUID), user_id, court_id (nullable), case_file_id (nullable), action, module, entity, entity_id, old_value (JSONB), new_value (JSONB), ip_address, user_agent, created_at

Service: create(dto), findAll(filters) — paginated, filterable by date/user/module

Controller: GET /api/v1/audit, GET /api/v1/cases/:id/timeline

AuditLogInterceptor (backend/src/common/interceptors/audit-log.interceptor.ts):
- Intercept POST/PUT/PATCH requests
- On successful write, create AuditLog with old/new values
- Skip for GET requests and auth endpoints

Register as APP_INTERCEPTOR in audit-log.module.ts

**4. Dashboard (Task 5.4)**
Dir: backend/src/modules/dashboard/
Files: module, controller, service

DashboardService:
- `getDashboard(userId, courtIds)` — returns aggregated widget data:
  - criticalDeadlines: cases with remaining <= 3 days
  - pendingServices: cases with pending service records (status != SERVED)
  - readyForFinalization: cases ready for kesinleşme
  - readyForAppealTransfer: appeals ready to transfer
  - feeMuzekkereRequired: fees with MUZEKKERE_REQUIRED status
  - returnedServices: RETURNED service records
  - recentActivity: last 10 audit logs for user's courts

Each widget returns: { count: number, items: Array<{ id, caseId, esasNo, title, remainingDays? }> }

Controller: GET /api/v1/dashboard

**Response Transform Interceptor** (backend/src/common/interceptors/response-transform.interceptor.ts):
- Wrap all responses in { success: true, data: ..., message: null }
- Register as APP_INTERCEPTOR globally

**After implementation:**
- Run `npm run build` in backend/
- Commit: `feat: add SureEngine, Notification, Audit Log, and Dashboard modules`

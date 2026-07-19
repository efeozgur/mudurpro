### Batch Task: Frontend Pages (Tasks 6.1-6.9)

Build ALL frontend pages. The scaffold already exists: React+Vite, Tailwind, shadcn/ui (button, input, card, table, badge, dialog, dropdown-menu, form, select, calendar, popover, tabs, separator, avatar), TanStack Query, React Router, React Hook Form + Zod, Axios api-client.

**CRITICAL RULES:**
- Use shadcn/ui components from `@/components/ui/` 
- Use `apiClient` from `@/lib/api-client` for all API calls
- Use `@tanstack/react-query` (useQuery, useMutation) for all data fetching
- Use `react-hook-form` + `zod` for all forms
- Standard response from API: `{ success: true, data: ..., message: null }`
- Turkish language for all UI text
- Mobile-responsive (Tailwind responsive classes)

**Pages to create:**

**1. Auth (update existing)**
- Update `frontend/src/pages/login.tsx` — full login form with email/password, error display, loading state, redirect to dashboard on success
- Update `frontend/src/lib/api-client.ts` — already done, check it works

**2. App Shell**
- `frontend/src/components/layout/sidebar.tsx` — role-based menu (SUPER_ADMIN: Adliyeler, Kullanıcılar, Audit Log | ADLIYE_ADMIN: Mahkemeler, Müdürler | MUDUR: Dashboard, Dosyalar, Süre Takvimi, Harçlar, Bildirimler)
- `frontend/src/components/layout/header.tsx` — user name, notification bell (with unread count badge), "Yeni Dosya" button (MUDUR only), logout dropdown
- `frontend/src/components/layout/app-layout.tsx` — sidebar left + header top + main content area with padding

**3. Shared Components**
- `frontend/src/components/shared/status-badge.tsx` — maps status string to color (ACTIVE=green, ARCHIVED=gray, SERVED=green, RETURNED=red, CRITICAL=red, KRITIK=red, WARNING=amber, YAKLASIYOR=amber, TAKIP=yellow, NORMAL=green, CREATED=blue, BEKLIYOR=blue)
- `frontend/src/components/shared/data-table.tsx` — reusable table with shadcn/ui Table, sorting, pagination controls, search input
- `frontend/src/components/shared/loading-spinner.tsx` — centered spinner
- `frontend/src/components/shared/empty-state.tsx` — centered message with icon
- `frontend/src/components/shared/confirm-dialog.tsx` — confirmation modal

**4. Dashboard Page**
- `frontend/src/pages/dashboard.tsx`
- `frontend/src/components/dashboard/stats-card.tsx` — colored card with icon, title, count (red/amber/blue/green)
- `frontend/src/components/dashboard/critical-table.tsx` — table showing 5 most urgent items
- `frontend/src/components/dashboard/suggestion-box.tsx` — blue info box
- Use `useQuery` to fetch GET /api/v1/dashboard
- 4 stats cards: Kritik Süreler, Bekleyen Tebligat, Kesinleşmeye Hazır, Harç Gereken
- Filter by court

**5. Case File Pages**
- `frontend/src/pages/cases.tsx` — data-table of all cases for user's courts
- `frontend/src/pages/case-detail.tsx` — tabbed view: Genel Bilgiler, Taraflar, Tebligatlar, Kanun Yolu, Harç
- `frontend/src/components/case-file/case-file-form.tsx` — create/edit form (zod schema + react-hook-form)
- Each tab loads its own data (useQuery)

**6. Party Management** (within CaseFileDetail)
- `frontend/src/components/party/party-list.tsx`
- `frontend/src/components/party/party-form.tsx` — dynamic fields based on PERSON/ORGANIZATION
- Duplicate warning display

**7. ServiceRecord, Appeal, Fee** (within CaseFileDetail)
- Each as a list + add form within the case detail tabs
- ServiceRecord: list + form + status update button
- Appeal: list + form with opposing party auto-display
- Fee: list + form + payment recording

**8. Notification Center**
- `frontend/src/components/notification/notification-center.tsx` — full page
- `frontend/src/components/notification/notification-bell.tsx` — dropdown in header
- Mark as read, mark as complete

**9. Audit Log Viewer**
- `frontend/src/components/audit-log/audit-log-viewer.tsx` — paginated table, date/user/module filters
- Read-only, no edit/delete

**10. Admin Pages**
- `frontend/src/pages/courthouse-management.tsx` — SUPER_ADMIN: table + create/edit form
- `frontend/src/pages/court-management.tsx` — ADLIYE_ADMIN: table + form
- `frontend/src/pages/user-management.tsx` — ADLIYE_ADMIN: user list + create/assign to courts

**11. Routing** — Update `frontend/src/App.tsx` with all routes:
```
/login → Login
/ → redirect to dashboard
/dashboard → Dashboard (protected)
/cases → Case List (protected)
/cases/:id → Case Detail (protected)
/courthouses → Courthouse Management (SUPER_ADMIN)
/courts → Court Management (ADLIYE_ADMIN)
/users → User Management (ADLIYE_ADMIN)
/notifications → Notification Center (protected)
/audit → Audit Logs (protected)
```

**After implementation:**
- Run `npm run build` in frontend/
- Commit: `feat: add all frontend pages with shadcn/ui, forms, data tables, and API integration`

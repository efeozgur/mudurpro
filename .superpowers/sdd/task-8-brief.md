### Batch Task: Remaining Backend CRUD Modules (3.2-4.3)

Create ALL of the following modules. Each follows the SAME pattern: entity (extends BaseEntity), module (TypeOrmModule.forFeature), service (CRUD methods), controller (JwtAuthGuard + RolesGuard + standard response), DTOs.

**1. Court Module (Task 3.2)**
Dir: backend/src/modules/court/
Entity: Court { courthouse_id, name, type, active } — no schema annotation (tenant schema, not public)
Service: findAll, create, update, findById, assignMudur(courtId, userId), removeMudur(courtId, userId)
  - assignMudur: insert into user_courts table (use EntityManager or Repository)
  - removeMudur: soft delete from user_courts (set deleted_at)
Controller: GET/POST/PUT /api/v1/courts, POST /api/v1/courts/:id/assign-mudur, DELETE /api/v1/courts/:id/assign-mudur
  - @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN') for CRUD
  - @Roles('ADLIYE_ADMIN', 'SUPER_ADMIN') for mudur assignment

**2. User-Court Entity (Task 3.2)**
Dir: backend/src/modules/user-court/entities/user-court.entity.ts
Entity: UserCourt { user_id, court_id } — UNIQUE(user_id, court_id)

**3. CaseFile Module (Task 3.3)**
Dir: backend/src/modules/case-file/
Entity: CaseFile { court_id, esas_no, karar_no, karar_tarihi, karar_sonucu, kanun_yolu, durum (default 'ACTIVE'), aciklama }
  - @Unique(['court_id', 'esas_no'])
Service: findAll (with court+status filters, pagination), findById, create, update, archive(id), restore(id)
  - create: validate same court + esas_no uniqueness (DV-001)
  - archive: set deleted_at (soft delete)
  - restore: clear deleted_at
Controller: GET/POST/PUT /api/v1/cases, PATCH /api/v1/cases/:id/archive, PATCH /api/v1/cases/:id/restore
  - @Roles('MUDUR') for all endpoints

**4. Party Module (Task 3.4)**
Dir: backend/src/modules/party/
Entity: Party { case_file_id, party_type (PERSON/ORGANIZATION), role (PLAINTIFF/DEFENDANT), first_name, last_name, organization_name, national_id, tax_number, phone, email, address, notes, is_active (default true), removal_reason }
Service: findByCaseFile, create, update, deactivate(id, reason), reactivate(id)
  - deactivate: set is_active=false, removal_reason, update updated_at
  - duplicate check: warn if same name+case_file (return warning, don't block)
Controller: GET/POST/PUT /api/v1/cases/:id/parties, PATCH /api/v1/parties/:id/deactivate, PATCH /api/v1/parties/:id/reactivate
  - @Roles('MUDUR')

**5. ServiceRecord Module (Task 4.1)**
Dir: backend/src/modules/service-record/
Entity: ServiceRecord { case_file_id, party_id, type, sent_date, served_date, status (default 'PREPARED'), aciklama }
  - status check: CHECK IN ('DRAFT','PREPARED','SENT','SERVED','RETURNED','CANCELLED')
Service: findByCaseFile, create, update, updateStatus(id, newStatus)
  - When status → 'SERVED', log that SureEngine should be triggered (just add a comment/placeholder)
  - Validate: served_date >= sent_date (TV-001)
  - Validate: RETURNED cannot have served_date (TV-002)
Controller: GET /api/v1/cases/:id/services, POST /api/v1/services, PUT /api/v1/services/:id, PATCH /api/v1/services/:id/status
  - @Roles('MUDUR')

**6. Appeal Module (Task 4.2)**
Dir: backend/src/modules/appeal/
Entity: Appeal { case_file_id, applicant_party_id, type (ISTINAF/TEMYIZ), application_date, status (default 'CREATED'), aciklama }
Service: findByCaseFile, create, update
  - create: validate applicant_party exists in case_file
  - get opposing parties: if applicant role=PLAINTIFF, return DEFENDANTs; vice versa
Controller: GET/POST /api/v1/cases/:id/appeals, PUT /api/v1/appeals/:id
  - @Roles('MUDUR')

**7. FeeTracking Module (Task 4.3)**
Dir: backend/src/modules/fee-tracking/
Entity: FeeTracking { case_file_id, debtor_party_id, type, amount (DECIMAL 12,2, CHECK >0), served_date, payment_due_date, status (default 'CREATED'), payment_date, aciklama }
  - status check: CHECK IN ('CREATED','WAITING_FOR_SERVICE','WAITING_PAYMENT','PAYMENT_COMPLETED','MUZEKKERE_REQUIRED','CLOSED')
Service: findByCaseFile, create, update, recordPayment(id, paymentDate)
  - validate: debtor_party exists in case_file
  - validate: amount > 0
Controller: GET/POST /api/v1/cases/:id/fees, PUT /api/v1/fees/:id, PATCH /api/v1/fees/:id/payment
  - @Roles('MUDUR')

**After implementation:**
- Run `npm run build` in backend/
- Commit: `feat: add Court, CaseFile, Party, ServiceRecord, Appeal, FeeTracking CRUD modules`

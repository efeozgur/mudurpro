# MudurPro - Oturum Özeti
## Tarih: 2026-07-21

Bu dosya, bu oturumda yapılan tüm değişikliklerin özetini içerir. Bir sonraki oturumda buradan devam edilebilir.

---

## Yapılan Değişiklikler

### 1. Docker Build Hatası (TypeScript)
- **`backend/src/modules/appeal/dto/create-appeal.dto.ts`** — `case_file_id` required yapıldı
- **`backend/src/modules/appeal/appeal.service.ts`** — `case_file_id` → `caseFileId` değişken ismi düzeltildi

### 2. Sidebar / Yetkilendirme
- **`frontend/src/components/layout/sidebar.tsx`** — MUDUR'dan "Denetim Kayıtları" kaldırıldı

### 3. Kullanıcı Değişince Eski Veri Kalmaması
- **`frontend/src/lib/auth.tsx`** — `logout()`'a `queryClient.clear()` eklendi
- **`frontend/src/lib/auth.tsx`** — User interface'e `courthouse_id` eklendi
- **`frontend/src/lib/auth.tsx`** — Login'den dönen `courthouseId` (camelCase) normalize edildi

### 4. Role Göre Yönlendirme
- **`frontend/src/App.tsx`** — HomeRedirect: SUPER_ADMIN→/courthouses, ADLIYE_ADMIN→/courts, MUDUR→/dashboard
- **`frontend/src/pages/login.tsx`** — Login sonrası role göre yönlendirme

### 5. ADLIYE_ADMIN Dashboard Görme (düzeltildi)
- **`backend/src/common/interceptors/tenant.interceptor.ts`** — Soft-delete courthouse için 403 atılmaz, sessizce geçilir

### 6. ADLIYE_ADMIN Adliye Yönetimi
- **`backend/src/modules/tenant/entities/courthouse.entity.ts`** — `connected_to` kolonu eklendi
- **`backend/src/modules/courthouse/dto/create-courthouse.dto.ts`** — `connected_to` alanı eklendi
- **`backend/src/modules/courthouse/courthouse.controller.ts`** — POST/GET/:id/PUT/DELETE rollerine ADLIYE_ADMIN eklendi, city/district override
- **`backend/src/modules/courthouse/courthouse.service.ts`** — `remove()` metodu eklendi
- **`frontend/src/pages/courthouse-management.tsx`** — ADLIYE_ADMIN için sidebar + form + silme + combobox'lar

### 7. Mahkeme Yönetimi (SUPER_ADMIN)
- **`backend/src/modules/court/court.service.ts`** — Tüm SUPER_ADMIN işlemleri explicit şema adıyla raw SQL (search_path sorunu çözüldü)
- **`backend/src/modules/court/court.controller.ts`** — Tüm endpoint'lere `@CurrentUser()` eklendi
- **`backend/src/modules/courthouse/courthouse.controller.ts`** — Hierarchy API eklendi

### 8. Tenant Schema Migration
- **`backend/src/modules/tenant/tenant.service.ts`** — `migrateExistingSchemas()` + `createReferenceTable()` eklendi
- **`backend/src/database/seed-hsk.sql`** — HSK adliye rehberi (1004 kayıt, temiz Türkçe karakterler)
- **`backend/nest-cli.json`** — SQL asset'leri dist'e kopyalanacak şekilde ayarlandı

### 9. Dashboard - Tebligat Takibi
- **`backend/src/modules/dashboard/dashboard.service.ts`** — `ServiceTrackingWidget`, `buildServiceTracking()` eklendi
- **`backend/src/modules/dashboard/dashboard.controller.ts`** — `serviceTracking` emptyDashboard'a eklendi
- **`frontend/src/pages/dashboard.tsx`** — "Tebligat Takibi" bölümü (durum kartları + tablo), tab'a tıklayınca `?tab=services`

### 10. Dashboard - Kesinleşmeye Hazır Filtre
- **`backend/src/modules/dashboard/dashboard.service.ts`** — `buildReadyForFinalization`'a `finalized_at: IsNull()` eklendi

### 11. Harç Son Ödeme Tarihi Otomatik Hesaplama
- **`backend/src/modules/fee-tracking/fee-tracking.service.ts`** — `create()` metodunda `served_date + 1 ay → payment_due_date`
- **`backend/src/modules/fee-tracking/fee-tracking.module.ts`** — ServiceRecord TypeORM feature'a eklendi
- **`frontend/src/components/fee/fee-list.tsx`** — "Son Ödeme Tarihi" alanı formdan kaldırıldı

### 12. Mobil Uyumluluk (Responsive)
- **`frontend/src/components/layout/app-layout.tsx`** — Sidebar state'i, mobile overlay, `md:ml-56`, `p-4 md:p-6`
- **`frontend/src/components/layout/sidebar.tsx`** — `open`/`onClose` props, hamburger, transition, kapatma butonu
- **`frontend/src/components/layout/header.tsx`** — `onMenuClick` prop, hamburger butonu, responsive padding
- **`frontend/src/pages/dashboard.tsx`** — 14 responsive değişiklik (padding, touch targets, overflow-x-auto)

### 13. fee_tracking/fee_trackings Tablo Adı Düzeltmesi
- Raw SQL: tekil `fee_tracking` → çoğul `fee_trackings`
- Entity: `@Entity('fee_trackings')` ile uyumlu
- **`backend/src/modules/case-file/case-file.service.ts`** — `.leftJoin('fee_tracking'...)` → `'fee_trackings'`

---

## Devam Edilecek İşler

### Mobil Uyumluluk (Sıradaki sayfalar)
- [ ] Dosya Listesi (`frontend/src/pages/cases.tsx`)
- [ ] Dosya Detayı (`frontend/src/pages/case-detail.tsx`)
- [ ] Adliyeler (`frontend/src/pages/courthouse-management.tsx`)
- [ ] Mahkemeler (`frontend/src/pages/court-management.tsx`)
- [ ] Kullanıcılar (`frontend/src/pages/user-management.tsx`)
- [ ] Bildirimler (`frontend/src/pages/notification-center.tsx`)

### Bilinen Sorunlar
- `emptyDashboard` controller'da `totalCasesCount`, `activeCasesCount`, etc. eksik (sadece SUPER_ADMIN için geçerli)
- Sure engine fee check: `WAITING_PAYMENT` status'üne hiçbir kod geçiş yapmıyor
- Seed'de ADLIYE_ADMIN kullanıcısı yok (manuel oluşturuluyor)

---

## Build Komutları
```bash
cd backend && npm run build
cd frontend && npm run build
cd docker && docker compose build && docker compose up
```

# Bölüm 16 — PostgreSQL Fiziksel Veritabanı Şeması

## 16.1 Amaç

Bu bölüm, mantıksal veritabanı modelinin PostgreSQL üzerinde nasıl uygulanacağını tanımlar.

Hedefler:

- Veri bütünlüğü
- Performans
- Ölçeklenebilirlik
- Güvenlik
- Kolay bakım

---

## 16.2 PostgreSQL Sürümü

- PostgreSQL 16+
- UTF-8 Encoding
- UTC zaman damgaları
- UUID Primary Key

---

## 16.3 İsimlendirme Kuralları

- snake_case kullanılacaktır.
- Tablo isimleri çoğul olacaktır.
- Foreign key alanları *_id biçiminde adlandırılacaktır.
- Enum yerine lookup tabloları tercih edilebilir.

---

## 16.4 Ortak Alanlar

Her tabloda aşağıdaki alanlar bulunmalıdır:

- id (UUID)
- created_at
- updated_at
- deleted_at (Soft Delete)
- created_by
- updated_by

---

## 16.5 Ana Tablolar

- courthouses
- courts
- users
- roles
- user_courts
- case_files
- parties
- service_records
- appeals
- fee_tracking
- notifications
- audit_logs

---

## 16.6 Foreign Key Kuralları

- ON DELETE RESTRICT kullanılacaktır.
- Cascade Delete kullanılmayacaktır.
- Veri silmek yerine Soft Delete uygulanacaktır.

---

## 16.7 Index Stratejisi

Index oluşturulması önerilen alanlar:

- court_id
- courthouse_id
- esas_no
- karar_no
- served_date
- status
- created_at

Composite Index örnekleri:

- (court_id, esas_no)
- (case_file_id, status)
- (party_id, served_date)

---

## 16.8 Constraint Kuralları

- Esas No aynı mahkemede tekil olmalıdır.
- Harç tutarı > 0 olmalıdır.
- Tebliğ tarihi çıkış tarihinden önce olamaz.
- Boş bırakılmaması gereken alanlar NOT NULL olmalıdır.

---

## 16.9 Partitioning

Aşağıdaki tablolar partition için uygun tasarlanmalıdır:

- audit_logs
- notifications

Öneri:
Aylık partition.

---

## 16.10 JSON Kullanımı

JSONB kullanılabilecek alanlar:

- audit_logs.old_value
- audit_logs.new_value
- system_settings
- notification_payload

---

## 16.11 Transaction Kuralları

Aşağıdaki işlemler transaction içinde çalışmalıdır:

- Dosya oluşturma
- Tebligat ekleme
- Kanun yolu oluşturma
- Harç kaydı
- Yetki atama

---

## 16.12 Backup

- Günlük tam yedek
- Saatlik WAL arşivi
- Noktaya dönüş (Point in Time Recovery) desteklenmelidir.

---

## 16.13 Performans

- EXPLAIN ANALYZE ile sorgular doğrulanmalıdır.
- N+1 sorguları engellenmelidir.
- Sayfalama LIMIT/OFFSET veya keyset pagination ile yapılmalıdır.

---

## 16.14 Test Senaryoları

TS-01
Aynı mahkemede aynı esas numarası.
Beklenen:
Unique Constraint hatası.

TS-02
Silinen kullanıcıya bağlı veri.
Beklenen:
Silme engellenir.

TS-03
Negatif harç.
Beklenen:
CHECK Constraint hatası.

---

## 16.15 Kodlama Ajanı Notları

- Migration aracı kullanılmalıdır.
- Ham SQL yerine migration dosyaları tercih edilmelidir.
- Tüm indeksler migration ile oluşturulmalıdır.
- Şema değişiklikleri geriye alınabilir (rollback) olmalıdır.

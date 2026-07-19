
# Bölüm 04 — Veritabanı Tasarımı

## 4.1 Amaç

Bu bölüm uygulamanın mantıksal veritabanı modelini tanımlar.
Veritabanı PostgreSQL hedeflenerek tasarlanacaktır.

---

# 4.2 Tasarım İlkeleri

- UUID birincil anahtar kullanılacaktır.
- Soft Delete uygulanacaktır.
- created_at, updated_at alanları tüm tablolarda bulunacaktır.
- Kritik tablolarda audit desteği sağlanacaktır.
- Foreign Key kısıtları zorunludur.

---

# 4.3 Ana Varlıklar

1. Courthouse (Adliye)
2. Court (Mahkeme)
3. User
4. Role
5. UserCourt
6. CaseFile
7. Party
8. ServiceRecord (Tebligat)
9. Appeal
10. FeeTracking
11. Notification
12. AuditLog

---

# 4.4 Tablolar

## Courthouse

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | UUID | PK |
| name | varchar(200) | Adliye Adı |
| city | varchar(100) | İl |
| active | boolean | Aktif |

---

## Court

| Alan | Tip |
|------|-----|
| id | UUID |
| courthouse_id | UUID FK |
| name | varchar(200) |
| type | varchar(50) |

Bir adliyenin birden fazla mahkemesi olabilir.

---

## User

| Alan | Tip |
|------|-----|
| id | UUID |
| name | varchar |
| email | varchar |
| password_hash | text |
| role_id | UUID |

---

## UserCourt

Mahkeme bazlı yetkilendirme tablosu.

Bir kullanıcı birçok mahkemeye atanabilir.

Bir mahkemede birçok kullanıcı olabilir.

---

## CaseFile

| Alan | Tip |
|------|-----|
| id | UUID |
| court_id | UUID |
| esas_no | varchar |
| karar_no | varchar |
| karar_tarihi | date |
| durum | varchar |
| appeal_type | varchar |

---

## Party

| Alan | Tip |
|------|-----|
| id | UUID |
| case_file_id | UUID |
| role | Plaintiff / Defendant |
| full_name | varchar |

Bir dosyada sınırsız taraf bulunabilir.

---

## ServiceRecord

| Alan | Tip |
|------|-----|
| id | UUID |
| party_id | UUID |
| sent_date | date |
| served_date | date |
| status | Waiting / Served / Returned |

Her taraf için birden fazla tebligat kaydı tutulabilir.

Silinmez.

---

## Appeal

| Alan | Tip |
|------|-----|
| id | UUID |
| case_file_id | UUID |
| applicant_party_id | UUID |
| type | Istinaf / Temyiz |
| application_date | date |

---

## FeeTracking

| Alan | Tip |
|------|-----|
| id | UUID |
| case_file_id | UUID |
| debtor_party_id | UUID |
| amount | decimal |
| served_date | date |
| paid | boolean |

---

## Notification

Dashboard bildirimleri.

- Yaklaşan süre
- Geciken süre
- Eksik bilgi
- Kesinleşmeye hazır
- Üst mahkemeye gönderilmeye hazır

---

## AuditLog

Her kritik işlem kayıt altına alınır.

Alanlar

- user_id
- action
- entity
- entity_id
- old_value
- new_value
- ip_address
- created_at

---

# 4.5 İlişkiler

Courthouse
└── Court

Court
└── CaseFile

CaseFile
├── Party
├── Appeal
├── FeeTracking

Party
└── ServiceRecord

User
└── UserCourt
    └── Court

---

# 4.6 Index Önerileri

- esas_no
- karar_no
- served_date
- status
- court_id
- courthouse_id

---

# 4.7 Veri Bütünlüğü

- Foreign key zorunlu.
- Cascade delete kullanılmayacaktır.
- Tarih alanları validation katmanında doğrulanacaktır.
- Soft delete kullanılacaktır.

---

# 4.8 Gelecekte Eklenecek Tablolar

- FileAttachment
- Timeline
- Reminder
- DashboardWidget
- SystemSettings
- BackupHistory
- LoginHistory
- PasswordReset
- NotificationPreference

Bu bölüm mantıksal modeldir. Fiziksel SQL şeması ilerleyen dokümanlarda ayrıntılı olarak hazırlanacaktır.

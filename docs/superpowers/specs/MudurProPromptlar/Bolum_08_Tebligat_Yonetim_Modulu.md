
# Bölüm 08 — Tebligat Yönetim Modülü

## 8.1 Amaç

Bu modül, dava dosyasındaki tüm tebligat süreçlerini eksiksiz izlemek ve
süre hesaplama motoruna doğru veri sağlamaktan sorumludur.

Sistem hiçbir tebligatı otomatik oluşturmaz veya tamamlamaz.
Kullanıcı tarafından girilen bilgileri doğrular ve iş kurallarını uygular.

---

# 8.2 Temel Kurallar

TB-001 Her tebligat tek bir tarafa aittir.

TB-002 Bir tarafın sınırsız sayıda tebligat kaydı olabilir.

TB-003 İade edilen tebligatlar silinmez.

TB-004 Başarılı tebliğ süreyi başlatır.

TB-005 İade edilen tebligat süre başlatmaz.

TB-006 Tüm değişiklikler Audit Log'a yazılır.

---

# 8.3 Tebligat Durumları

- DRAFT
- PREPARED
- SENT
- SERVED
- RETURNED
- CANCELLED

Durum geçişleri yalnızca tanımlı iş akışına göre yapılabilir.

---

# 8.4 Zorunlu Alanlar

- Dosya
- Taraf
- Tebligat Türü
- Çıkış Tarihi
- Durum

SERVED durumunda Tebliğ Tarihi zorunludur.

---

# 8.5 Tebligat Türleri

- Gerekçeli Karar
- İstinaf Başvurusu
- Temyiz Başvurusu
- Harç Bildirimi
- Müzekkere
- Diğer

Yeni türler sistem ayarlarından eklenebilir.

---

# 8.6 İş Akışı

Dosya seçilir
↓
Taraf seçilir
↓
Tebligat oluşturulur
↓
Çıkış tarihi girilir
↓
Durum güncellenir
↓
Served ise süre motoru tetiklenir
↓
Returned ise yeni tebligat önerilir

---

# 8.7 Süre Motoru Entegrasyonu

SERVED:
- Süre hesaplanır.
- Dashboard güncellenir.

RETURNED:
- Süre hesaplanmaz.
- "Yeni tebligat gerekli." bildirimi oluşturulur.

---

# 8.8 Validasyon Kuralları

TV-001 Tebliğ tarihi çıkış tarihinden önce olamaz.

TV-002 RETURNED durumunda tebliğ tarihi girilemez.

TV-003 Aynı kayıt hem SERVED hem RETURNED olamaz.

TV-004 Taraf silinmiş/pasif ise yeni tebligat eklenemez.

TV-005 Arşivlenmiş dosyada tebligat oluşturulamaz.

---

# 8.9 API

GET /cases/{id}/services

POST /cases/{id}/services

PUT /services/{id}

PATCH /services/{id}/status

GET /services/{id}

---

# 8.10 Bildirimler

- Tebligatı bekleyen dosyalar
- İade edilen tebligatlar
- Süresi başlayan dosyalar
- Eksik tebligat bulunan dosyalar

---

# 8.11 Test Senaryoları

TS-01
İade edilen tebligat sonrası süre hesaplanmamalıdır.

TS-02
Başarılı tebliğ girildiğinde süre motoru çalışmalıdır.

TS-03
Tebliğ tarihi çıkış tarihinden önce girildiğinde işlem reddedilmelidir.

TS-04
Arşiv dosyasına tebligat eklenememelidir.

---

# 8.12 Kodlama Ajanı Notları

- Tebligat geçmişi immutable kabul edilmelidir.
- Güncelleme yerine yeni kayıt yaklaşımı tercih edilmelidir.
- Süre hesaplama mantığı bu modülde değil Süre Motoru servisinde yer almalıdır.
- Dashboard olay tabanlı (event-driven) olarak güncellenmelidir.

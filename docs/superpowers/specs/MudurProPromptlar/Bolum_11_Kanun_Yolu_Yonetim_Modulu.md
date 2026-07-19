# Bölüm 11 — Kanun Yolu (İstinaf / Temyiz) Yönetim Modülü

## 11.1 Amaç

Bu modül, karar sonrası istinaf ve temyiz süreçlerinin eksiksiz takip edilmesini sağlar.

Sistem hukuki başvuru yapmaz.
Yalnızca başvuruları kaydeder, iş kurallarını doğrular ve gerekli uyarıları üretir.

---

## 11.2 Temel Kurallar

KY-001 Başvuru yalnızca mevcut taraflardan biri tarafından yapılabilir.

KY-002 Başvuru yapan taraf, karşı taraf listesinde yer alamaz.

KY-003 Karşı taraflara yapılacak tebligatlar tamamlanmadan dosya üst mahkemeye gönderilmeye hazır duruma gelemez.

KY-004 Her başvuru Audit Log'a kaydedilir.

---

## 11.3 Kanun Yolu Türleri

- İstinaf
- Temyiz

Her başvuru aşağıdaki bilgilerle saklanmalıdır:

- Başvuru Türü
- Başvuru Tarihi
- Başvuran Taraf
- Açıklama
- Durum

---

## 11.4 İş Akışı

Karar Verildi
↓
Başvuru Kaydedildi
↓
Karşı Taraflar Belirlendi
↓
Karşı Taraf Tebligatları
↓
Son Başarılı Tebliğ Tarihi
↓
14 Gün Bekleme
↓
Üst Mahkemeye Gönderilmeye Hazır

---

## 11.5 Karşı Taraf Belirleme

Davacı başvurduysa yalnızca davalılar karşı taraf kabul edilir.

Davalı başvurduysa yalnızca davacılar karşı taraf kabul edilir.

Çok taraflı dosyalarda tüm karşı taraflar otomatik listelenmelidir.

---

## 11.6 Validasyon

KV-001 Başvuru tarihi karar tarihinden önce olamaz.

KV-002 Başvuran taraf dosyada bulunmalıdır.

KV-003 Karşı taraf bulunmayan başvuru oluşturulamaz.

KV-004 Arşivlenmiş dosyada yeni başvuru oluşturulamaz.

---

## 11.7 Durumlar

- CREATED
- WAITING_FOR_SERVICE
- WAITING_LEGAL_PERIOD
- READY_FOR_TRANSFER
- TRANSFER_COMPLETED

---

## 11.8 API

GET /cases/{id}/appeals

POST /cases/{id}/appeals

PUT /appeals/{id}

PATCH /appeals/{id}/status

GET /appeals/{id}

---

## 11.9 Bildirimler

- Karşı taraf tebligatı bekleniyor.
- Kanuni süre başladı.
- Üst mahkemeye gönderilmeye hazır.
- Eksik başvuru bilgisi.

---

## 11.10 Test Senaryoları

TS-01
Davacı başvurur.
Beklenen: Sadece davalılar karşı taraf olur.

TS-02
Sekiz davalıdan biri tebliğ edilmedi.
Beklenen: READY_FOR_TRANSFER oluşmaz.

TS-03
Son karşı tarafın tebliğ tarihi esas alınır.

TS-04
Başvuru tarihi karar tarihinden önce girilir.
Beklenen: Validation hatası.

---

## 11.11 Kodlama Ajanı Notları

- Başvuru ve karşı taraf ilişkisi servis katmanında hesaplanmalıdır.
- Süre hesaplama yalnızca Süre Motoru tarafından yapılmalıdır.
- Modül event-driven çalışmalı ve Dashboard'u güncellemelidir.

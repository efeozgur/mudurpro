# Bölüm 12 — Harç Takip Modülü

## 12.1 Amaç

Harç Takip Modülü, karar sonrası tahsil edilmesi gereken bakiye harçların takip edilmesini sağlar.

Bu modül ödeme yapmaz, tahsilat gerçekleştirmez veya müzekkere göndermez.
Sadece süreçleri izler, süreleri hesaplar ve kullanıcıyı bilgilendirir.

---

## 12.2 Temel İş Kuralları

HT-001 Harç borçlusu dosyadaki taraflardan biri olmalıdır.

HT-002 Harç tutarı pozitif bir değer olmalıdır.

HT-003 Harç bildirimi tebliğ edilmeden ödeme süresi başlamaz.

HT-004 Ödeme yapıldığında süreç kapanır.

HT-005 Ödeme yapılmadığında sistem yalnızca müzekkere önerisi üretir.

---

## 12.3 Süreç Akışı

Karar Verildi
↓
Harç Borçlusu Belirlendi
↓
Harç Bildirimi Tebliğe Çıkarıldı
↓
Başarılı Tebliğ
↓
1 Aylık Ödeme Süresi
↓
Ödeme Yapıldı → Süreç Tamamlandı

veya

Ödeme Yapılmadı
↓
15 Günlük Müzekkere Süreci
↓
"Müzekkere Hazırlanmalı" Uyarısı

---

## 12.4 Veri Alanları

- Dosya
- Borçlu Taraf
- Harç Türü
- Harç Tutarı
- Tebliğ Tarihi
- Son Ödeme Tarihi
- Ödeme Durumu
- Ödeme Tarihi
- Açıklama

---

## 12.5 Durumlar

CREATED

WAITING_FOR_SERVICE

WAITING_PAYMENT

PAYMENT_COMPLETED

MUZEKKERE_REQUIRED

CLOSED

---

## 12.6 Validasyon

HV-001 Borçlu taraf dosyada bulunmalıdır.

HV-002 Harç tutarı sıfırdan büyük olmalıdır.

HV-003 Ödeme tarihi tebliğ tarihinden önce olamaz.

HV-004 Arşivlenmiş dosyada yeni harç kaydı açılamaz.

HV-005 Ödenmiş kayıt tekrar bekleyen duruma alınamaz.

---

## 12.7 Bildirimler

- Harç bildirimi bekleniyor.
- Ödeme süresi başladı.
- Son ödeme tarihi yaklaşıyor.
- Ödeme süresi geçti.
- Müzekkere hazırlanmalı.
- Harç ödendi.

---

## 12.8 API

GET /cases/{id}/fees

POST /cases/{id}/fees

PUT /fees/{id}

PATCH /fees/{id}/payment

GET /fees/{id}

---

## 12.9 Test Senaryoları

TS-01
Harç bildirimi yapılmadı.
Beklenen:
Ödeme süresi başlamaz.

TS-02
1 aylık süre doldu.
Beklenen:
Müzekkere önerisi oluşur.

TS-03
Ödeme kaydedildi.
Beklenen:
PAYMENT_COMPLETED.

TS-04
Ödeme tarihi tebliğ tarihinden önce girildi.
Beklenen:
Validation hatası.

---

## 12.10 Kodlama Ajanı Notları

- Harç süresi yalnızca Süre Hesaplama Motoru tarafından hesaplanmalıdır.
- Ödeme bilgisi değiştiğinde Dashboard ve Bildirim Servisi olay tabanlı güncellenmelidir.
- Harç hareketleri Audit Log'a eksiksiz yazılmalıdır.

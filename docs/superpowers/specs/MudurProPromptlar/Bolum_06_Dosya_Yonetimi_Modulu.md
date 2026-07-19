
# Bölüm 06 — Dosya Yönetimi Modülü

## 6.1 Amaç

Dosya Yönetimi Modülü, mahkemelerde görülen dava dosyalarının yaşam döngüsünü yönetir.
Bu modül uygulamanın merkezidir ve diğer tüm modüller (Taraf, Tebligat, İstinaf, Harç, Bildirim vb.) bu modüle bağlı çalışır.

---

# 6.2 Temel Prensipler

- Her dosya yalnızca bir mahkemeye aittir.
- Dosya hiçbir zaman fiziksel olarak silinmez.
- Dosyanın tüm değişiklikleri Audit Log'a yazılır.
- Dosya durumu sistem tarafından hesaplanabilir ancak hukuki işlemler kullanıcı tarafından onaylanır.

---

# 6.3 Dosya Yaşam Döngüsü

Taslak
↓
Aktif
↓
Karar Verildi
↓
Tebligat Süreci
↓
Bekleme Süreci
↓
Kesinleşmeye Hazır / Üst Mahkemeye Gönderilmeye Hazır
↓
Arşiv

---

# 6.4 Zorunlu Alanlar

- Mahkeme
- Esas No
- Karar No
- Dosya Türü
- Karar Tarihi
- Karar Sonucu
- Kanun Yolu Türü
- Açılış Tarihi

Kayıt bu alanlar olmadan oluşturulamaz.

---

# 6.5 Opsiyonel Alanlar

- Açıklama
- İç Not
- Etiketler
- Fiziki Raf Bilgisi
- Dosya Kategorisi

---

# 6.6 Dosya Durumları

DRAFT
ACTIVE
DECISION_WRITTEN
SERVICE_IN_PROGRESS
WAITING_LEGAL_PERIOD
READY_FOR_FINALIZATION
READY_FOR_APPEAL_TRANSFER
ARCHIVED

Durum geçişleri iş kurallarına göre yapılacaktır.

---

# 6.7 Dosya İşlemleri

## Oluştur

Yeni dosya oluşturur.

## Güncelle

Temel bilgileri günceller.

## Arşivle

Dosyayı pasif hale getirir.

## Yeniden Aç

Arşivden aktif duruma alır.

## Görüntüle

Dosyanın tüm geçmişini gösterir.

---

# 6.8 Dosya Kartı

Dosya ekranında aşağıdaki özet bilgiler bulunacaktır.

- Mahkeme
- Esas No
- Karar No
- Dosya Durumu
- Son İşlem
- Son Tebligat
- Bekleyen Süre
- Son Güncelleme

---

# 6.9 Sekmeler

1. Genel Bilgiler
2. Taraflar
3. Tebligatlar
4. Kanun Yolu
5. Harç
6. Bildirimler
7. İşlem Geçmişi
8. Audit Log

---

# 6.10 Validasyon

DV-001 Aynı mahkemede aynı Esas No tekrar oluşturulamaz.

DV-002 Karar tarihi açılış tarihinden önce olamaz.

DV-003 Arşivlenmiş dosyada yeni işlem yapılamaz.

DV-004 Dosya durumu geriye alınamaz (yetkili yönetici işlemleri hariç).

DV-005 Zorunlu alanlar boş bırakılamaz.

---

# 6.11 API Gereksinimleri

GET /cases

GET /cases/{id}

POST /cases

PUT /cases/{id}

PATCH /cases/{id}/archive

PATCH /cases/{id}/restore

GET /cases/{id}/timeline

GET /cases/{id}/audit

---

# 6.12 Performans

- Listeleme sayfalama (pagination) desteklemelidir.
- Esas No ve Karar No ile hızlı arama yapılmalıdır.
- Mahkeme bazlı filtreleme zorunludur.
- Duruma göre filtreleme desteklenmelidir.

---

# 6.13 Test Senaryoları

TS-01
Geçersiz esas numarası ile kayıt oluştur.
Beklenen: Validation hatası.

TS-02
Aynı mahkemede aynı Esas No ile ikinci kayıt oluştur.
Beklenen: Kayıt reddedilir.

TS-03
Arşivlenmiş dosyaya tebligat eklemeye çalış.
Beklenen: İşlem reddedilir.

TS-04
Dosya yeniden açılır.
Beklenen: ACTIVE durumuna döner ve Audit Log oluşturulur.

---

# 6.14 Kodlama Ajanı Notları

- Dosya durumu enum olarak modellenmelidir.
- İş kuralları servis katmanında uygulanmalıdır.
- UI yalnızca mevcut durumu göstermelidir.
- Tüm durum değişiklikleri transaction içinde gerçekleştirilmelidir.
- Timeline ve Audit Log ayrı servisler olarak tasarlanmalıdır.

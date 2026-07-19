# Bölüm 13 — Bildirim Motoru

## 13.1 Amaç

Bildirim Motoru, sistemde gerçekleşen olayları analiz ederek kullanıcıya doğru zamanda doğru uyarıyı üretir.

Bildirim Motoru hiçbir hukuki işlemi otomatik başlatmaz.
Sadece bilgilendirir, önceliklendirir ve takip edilmesi gereken işleri kullanıcıya sunar.

---

## 13.2 Tasarım İlkeleri

BM-001 Bildirimler olay (event) tabanlı üretilmelidir.

BM-002 Aynı olay için mükerrer bildirim oluşturulmamalıdır.

BM-003 Bildirimler kullanıcı yetkisine göre filtrelenmelidir.

BM-004 Kapatılan bildirimler arşivlenmeli, silinmemelidir.

---

## 13.3 Bildirim Kaynakları

- Süre Hesaplama Motoru
- Tebligat Modülü
- Kanun Yolu Modülü
- Harç Takip Modülü
- Dosya Yönetimi
- Yetkilendirme Sistemi

---

## 13.4 Bildirim Türleri

- Bilgilendirme (INFO)
- Uyarı (WARNING)
- Kritik (CRITICAL)
- Başarılı İşlem (SUCCESS)
- Sistem (SYSTEM)

---

## 13.5 Öncelik Seviyeleri

P1 Kritik
P2 Yüksek
P3 Orta
P4 Düşük

Kritik bildirimler Dashboard'da en üstte gösterilir.

---

## 13.6 Üretim Kuralları

- Süresi başlayan dosya → Uyarı
- Süresi yaklaşan dosya → Uyarı
- Süresi geçen dosya → Kritik
- Kesinleşmeye hazır → Bilgilendirme
- Üst mahkemeye gönderilmeye hazır → Bilgilendirme
- Harç müzekkeresi gerekli → Kritik
- İade tebligat → Uyarı
- Eksik veri → Uyarı

---

## 13.7 Yaşam Döngüsü

CREATED
↓
UNREAD
↓
READ
↓
COMPLETED
↓
ARCHIVED

---

## 13.8 Veri Alanları

- Bildirim ID
- Kullanıcı ID
- Dosya ID
- Tür
- Öncelik
- Başlık
- Açıklama
- Oluşturulma Tarihi
- Okunma Tarihi
- Tamamlanma Tarihi
- Durum

---

## 13.9 API

GET /notifications

GET /notifications/{id}

PATCH /notifications/{id}/read

PATCH /notifications/{id}/complete

GET /notifications/unread

---

## 13.10 Validasyon

BN-001 Yetkisiz kullanıcı bildirim göremez.

BN-002 Tamamlanan bildirim tekrar okunmamış yapılamaz.

BN-003 Arşivlenen bildirim silinmez.

---

## 13.11 Test Senaryoları

TS-01
Süre geçti.
Beklenen:
CRITICAL bildirim oluşur.

TS-02
İade tebligat.
Beklenen:
WARNING bildirimi oluşur.

TS-03
Yetkisiz kullanıcı.
Beklenen:
Bildirim listesi boş döner.

TS-04
Bildirim tamamlandı.
Beklenen:
Dashboard'da aktif listeden çıkar.

---

## 13.12 Kodlama Ajanı Notları

- Bildirim Motoru bağımsız bir servis olarak tasarlanmalıdır.
- Event Bus veya benzeri olay mimarisi desteklenmelidir.
- Aynı olay için tekil (idempotent) bildirim üretimi sağlanmalıdır.
- Dashboard yalnızca Bildirim Servisinin ürettiği verileri göstermelidir.

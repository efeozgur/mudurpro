# Bölüm 10 — Dashboard ve Bildirim Sistemi

## 10.1 Amaç

Dashboard, Yazı İşleri Müdürünün sisteme giriş yaptığında yapması gereken işleri öncelik sırasına göre gösteren ana çalışma ekranıdır.

Bu ekran dosya listesi değil, görev odaklı bir çalışma panelidir.

---

## 10.2 Temel Prensipler

DB-001 Kullanıcı önce işi görmelidir, dosyayı değil.

DB-002 Dashboard yalnızca kullanıcının yetkili olduğu mahkemelerdeki kayıtları gösterir.

DB-003 Bildirimler gerçek zamanlı veya yeniden hesaplama sonrası güncellenir.

DB-004 Dashboard hukuki işlem yapmaz, yalnızca öneri sunar.

---

## 10.3 Ana Widget'lar

1. Bugün Yapılması Gerekenler
2. Süresi Yaklaşan İşlemler
3. Süresi Geçmiş İşlemler
4. Kesinleşmeye Hazır Dosyalar
5. Üst Mahkemeye Gönderilmeye Hazır Dosyalar
6. Harç Müzekkeresi Gereken Dosyalar
7. İade Tebligatlar
8. Eksik Bilgi Bulunan Dosyalar
9. Son İşlemler

---

## 10.4 Öncelik Seviyeleri

KIRMIZI
- Süresi geçmiş
- Kritik hata
- Bekleyen zorunlu işlem

SARI
- Süresi yaklaşan
- Eksik bilgi
- Yakında işlem gerekecek

YEŞİL
- Tamamlanan görev
- Bilgilendirme

---

## 10.5 Bildirim Türleri

- Bilgilendirme
- Uyarı
- Kritik Uyarı
- Sistem Mesajı

Her bildirim oluşturulma zamanı, kaynak modül ve ilgili dosya bilgisi ile saklanmalıdır.

---

## 10.6 Filtreleme

Dashboard aşağıdaki filtreleri desteklemelidir.

- Mahkeme
- Dosya Durumu
- Tarih Aralığı
- Öncelik
- Bildirim Türü

---

## 10.7 Arama

Arama kriterleri:

- Esas No
- Karar No
- Taraf Adı
- Dosya Durumu

---

## 10.8 Bildirim Üretim Kuralları

- Süre hesaplama motorundan gelen olaylar bildirim üretir.
- Aynı olay için mükerrer bildirim oluşturulmaz.
- Çözülen bildirim otomatik kapanmaz; kullanıcı tarafından tamamlandı olarak işaretlenebilir.

---

## 10.9 API

GET /dashboard

GET /dashboard/widgets

GET /notifications

PATCH /notifications/{id}/read

PATCH /notifications/{id}/complete

---

## 10.10 Performans

- Dashboard ilk açılışta 2 saniyeden kısa sürede yüklenmelidir.
- Widget verileri bağımsız yüklenebilmelidir.
- Büyük veri kümelerinde sayfalama kullanılmalıdır.

---

## 10.11 Test Senaryoları

TS-01
Süresi geçen dosya.
Beklenen: Kırmızı widget.

TS-02
Eksik tebligat.
Beklenen: Eksik Bilgi bildirimi.

TS-03
Yetkisiz mahkeme dosyası.
Beklenen: Dashboard'da görünmez.

TS-04
Kesinleşmeye hazır dosya.
Beklenen: İlgili widget içinde listelenir.

---

## 10.12 Kodlama Ajanı Notları

- Dashboard olay tabanlı güncellenmelidir.
- Widget mimarisi modüler olmalıdır.
- Bildirim servisi ayrı bir servis olarak tasarlanmalıdır.
- Dashboard sorguları optimize edilmeli ve gerekli alanlarda önbellekleme (cache) kullanılmalıdır.

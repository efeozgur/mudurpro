# Bölüm 17 — Frontend UI/UX Tasarım Standartları

## 17.1 Amaç

Bu bölüm, sistemin kullanıcı arayüzü (UI) ve kullanıcı deneyimi (UX) standartlarını tanımlar.

Hedefler:

- Hızlı öğrenilebilir arayüz
- Minimum tıklama ile işlem tamamlama
- Tutarlı tasarım dili
- Erişilebilirlik
- Responsive kullanım

---

## 17.2 Tasarım İlkeleri

UI-001 Aynı işlem her ekranda aynı şekilde çalışmalıdır.

UI-002 Birincil işlemler her zaman görünür olmalıdır.

UI-003 Kritik uyarılar renk ve ikon ile belirtilmelidir.

UI-004 Kullanıcıdan gereksiz veri istenmemelidir.

---

## 17.3 Ana Ekranlar

- Giriş
- Dashboard
- Dosya Listesi
- Dosya Detayı
- Taraf Yönetimi
- Tebligat Yönetimi
- Kanun Yolu
- Harç Takibi
- Bildirim Merkezi
- Audit Log
- Yönetim Paneli

---

## 17.4 Dashboard

Dashboard aşağıdaki bileşenleri içermelidir:

- Bekleyen İşler
- Süresi Yaklaşan Dosyalar
- Geciken İşlemler
- Son Bildirimler
- İstatistik Kartları

---

## 17.5 Dosya Detay Sayfası

Sekmeler:

- Genel Bilgiler
- Taraflar
- Tebligatlar
- Kanun Yolu
- Harç
- Audit Geçmişi

---

## 17.6 Form Standartları

- Zorunlu alanlar işaretlenmelidir.
- Alan doğrulamaları anlık yapılmalıdır.
- Tarih alanları takvim bileşeni kullanmalıdır.
- Hata mesajları anlaşılır olmalıdır.

---

## 17.7 Renk Sistemi

- Yeşil: Tamamlandı
- Mavi: Bilgilendirme
- Sarı: Uyarı
- Kırmızı: Kritik
- Gri: Pasif

---

## 17.8 Yetkilendirme

Kullanıcının yetkisi olmayan menüler gizlenmelidir.

Sunucu tarafı yetkilendirme her zaman devam etmelidir.

---

## 17.9 Performans

- İlk ekran 2 saniye içinde yüklenmelidir.
- Sayfalama kullanılmalıdır.
- Büyük tablolar sanal listeleme (virtual scrolling) desteklemelidir.

---

## 17.10 Erişilebilirlik

- Klavye ile gezinme
- Yeterli renk kontrastı
- ARIA etiketleri
- Ekran okuyucu uyumluluğu

---

## 17.11 Test Senaryoları

TS-01
Yetkisiz kullanıcı yönetim ekranını açmaya çalışır.
Beklenen: Menü görünmez ve erişim reddedilir.

TS-02
Zorunlu alan boş bırakılır.
Beklenen: Form gönderilmez.

TS-03
Kritik bildirim oluşur.
Beklenen: Dashboard'da kırmızı uyarı görünür.

---

## 17.12 Kodlama Ajanı Notları

- Bileşen tabanlı mimari kullanılmalıdır.
- Ortak UI bileşenleri tekrar kullanılabilir olmalıdır.
- Durum yönetimi merkezi olarak tasarlanmalıdır.
- Tüm metinler çoklu dil desteğine uygun olmalıdır.

# Bölüm 14 — Audit Log ve İşlem Geçmişi

## 14.1 Amaç

Audit Log modülü, sistem üzerinde gerçekleştirilen tüm kritik işlemleri değiştirilemez şekilde kayıt altına alır.

Bu modülün amacı;

- Hesap verebilirlik sağlamak
- Kullanıcı işlemlerini izlemek
- Hataları geriye dönük incelemek
- Güvenlik denetimlerini desteklemektir.

---

## 14.2 Temel İlkeler

AL-001 Audit kayıtları silinemez.

AL-002 Audit kayıtları sonradan değiştirilemez.

AL-003 Her kritik işlem tek bir Audit kaydı üretir.

AL-004 Audit kayıtları kullanıcı yetkilerine göre görüntülenir.

---

## 14.3 Loglanacak İşlemler

- Giriş / Çıkış
- Dosya oluşturma
- Dosya güncelleme
- Dosya arşivleme
- Taraf ekleme / güncelleme
- Tebligat ekleme / güncelleme
- Kanun yolu başvurusu
- Harç kaydı
- Kullanıcı oluşturma
- Rol değişikliği
- Mahkeme atama / kaldırma
- Manuel kesinleşme
- Manuel üst mahkemeye gönderme

---

## 14.4 Veri Modeli

Alanlar

- Audit ID
- Kullanıcı ID
- Mahkeme ID
- Dosya ID (opsiyonel)
- İşlem Türü
- Modül
- Eski Değer (JSON)
- Yeni Değer (JSON)
- IP Adresi
- User Agent
- Tarih/Saat

---

## 14.5 İşlem Geçmişi

Her dosya için zaman çizelgesi oluşturulmalıdır.

Örnek:

09:12 Dosya oluşturuldu

09:30 Davacı eklendi

09:45 Davalı eklendi

10:20 Tebligat oluşturuldu

14:15 Tebliğ edildi

---

## 14.6 API

GET /audit

GET /audit/{id}

GET /cases/{id}/timeline

GET /cases/{id}/audit

---

## 14.7 Yetkilendirme

Super Admin:
Tüm kayıtları görebilir.

Adliye Admini:
Yalnızca kendi adliyesindeki kayıtları görebilir.

Yazı İşleri Müdürü:
Yalnızca yetkili olduğu mahkemelerdeki kayıtları görebilir.

---

## 14.8 Arama ve Filtreleme

- Kullanıcı
- Modül
- İşlem Türü
- Tarih Aralığı
- Mahkeme
- Dosya

---

## 14.9 Validasyon

AU-001 Audit kaydı güncellenemez.

AU-002 Audit kaydı silinemez.

AU-003 Kimliği doğrulanmamış kullanıcı Audit verisi göremez.

---

## 14.10 Performans

- Audit tablosu partition desteğine uygun tasarlanmalıdır.
- Eski kayıtlar arşivlenebilir ancak silinmez.
- Tarih ve kullanıcı alanlarında indeks bulunmalıdır.

---

## 14.11 Test Senaryoları

TS-01
Dosya güncellendi.
Beklenen:
Yeni Audit kaydı oluşur.

TS-02
Audit kaydı silinmeye çalışılır.
Beklenen:
İşlem reddedilir.

TS-03
Yetkisiz kullanıcı audit ekranına girer.
Beklenen:
403 Forbidden.

---

## 14.12 Kodlama Ajanı Notları

- Audit altyapısı merkezi middleware veya interceptor ile uygulanmalıdır.
- Eski ve yeni değerler JSON formatında saklanmalıdır.
- Audit kayıtları uygulamanın hiçbir modülü tarafından değiştirilememelidir.

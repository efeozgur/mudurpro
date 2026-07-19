# Bölüm 18 — Test Stratejisi ve Kalite Güvence (QA)

## 18.1 Amaç

Bu bölüm, sistemin geliştirme sürecinde uygulanacak test stratejisini ve kalite güvence kurallarını tanımlar.

Hedefler:

- Hataları erken tespit etmek
- Regresyonları önlemek
- Güvenilir sürümler yayınlamak
- İş kurallarının doğruluğunu doğrulamak

---

## 18.2 Test Katmanları

- Birim Testleri (Unit Tests)
- Entegrasyon Testleri
- API Testleri
- Uçtan Uca (E2E) Testler
- Performans Testleri
- Güvenlik Testleri
- Kullanıcı Kabul Testleri (UAT)

---

## 18.3 Birim Testleri

- Her servis metodu test edilmelidir.
- İş kuralları ayrı ayrı doğrulanmalıdır.
- Dış bağımlılıklar mock edilmelidir.

---

## 18.4 Entegrasyon Testleri

Doğrulanacak örnek akışlar:

- Dosya → Taraf → Tebligat
- Tebligat → Süre Hesaplama
- Kanun Yolu → Bildirim
- Harç → Dashboard

---

## 18.5 API Testleri

Kontrol edilecek başlıklar:

- HTTP durum kodları
- Doğrulama hataları
- Yetkilendirme
- JSON şeması
- Hata yanıtları

---

## 18.6 E2E Senaryoları

- Yeni dosya oluşturma
- Tebligat kaydetme
- Kanun yolu başvurusu
- Harç takibi
- Audit kayıtlarının oluşması

---

## 18.7 Performans Testleri

Hedefler:

- İlk sayfa < 2 saniye
- API ortalama yanıt süresi < 500 ms
- 100 eşzamanlı kullanıcı altında kararlı çalışma

---

## 18.8 Güvenlik Testleri

- JWT doğrulama
- Yetki kontrolleri
- SQL Injection
- XSS
- CSRF (gereken yerlerde)
- Rate limiting doğrulaması

---

## 18.9 Kullanıcı Kabul Testleri

Her modül için iş birimi tarafından onay verilmelidir.

Kabul kriterleri:

- İş kuralları doğru çalışıyor.
- Kritik hata bulunmuyor.
- Performans kabul edilebilir.

---

## 18.10 Hata Yönetimi

Hatalar önceliklendirilmelidir:

- P1 Kritik
- P2 Yüksek
- P3 Orta
- P4 Düşük

---

## 18.11 Çıkış Kriterleri

Sürüm yayınlanmadan önce:

- Tüm kritik hatalar kapatılmış olmalı.
- Otomatik testler başarılı olmalı.
- UAT tamamlanmış olmalı.
- Güvenlik kontrolleri geçilmiş olmalı.

---

## 18.12 Kodlama Ajanı Notları

- CI/CD hattında otomatik testler zorunlu olmalıdır.
- Kod kapsamı (coverage) raporlanmalıdır.
- Yeni özellikler regresyon testlerine dahil edilmelidir.

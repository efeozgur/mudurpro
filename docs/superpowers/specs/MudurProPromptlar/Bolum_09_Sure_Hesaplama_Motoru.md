# Bölüm 09 — Süre Hesaplama Motoru

## 9.1 Amaç

Süre Hesaplama Motoru, uygulamanın merkezindeki iş kuralı servisidir.

Görevleri:

- Hukuki süreleri hesaplamak
- Eksik verileri tespit etmek
- Süre başlangıçlarını belirlemek
- Yaklaşan süreleri bildirmek
- Geciken işlemleri raporlamak

Bu modül hiçbir hukuki işlemi otomatik gerçekleştirmez.

---

## 9.2 Temel Prensipler

SM-001 Hesaplama yalnızca başarılı tebliğ kayıtları üzerinden yapılır.

SM-002 İade edilen tebligatlar süre başlatmaz.

SM-003 Tüm süre hesaplamaları merkezi servis tarafından yapılır.

SM-004 UI katmanında tarih hesaplaması yapılmaz.

SM-005 Aynı algoritma tüm modüller tarafından kullanılır.

---

## 9.3 Veri Kaynakları

Motor aşağıdaki modüllerden veri alır.

- Dosya
- Taraf
- Tebligat
- Kanun Yolu
- Harç
- Sistem Ayarları

---

## 9.4 Hesaplama Akışı

Dosya

↓

Taraflar

↓

Tebligatlar

↓

Başarılı Tebliğ Var mı?

↓

Hayır → Hesaplama yapılmaz.

↓

Evet

↓

Son Başarılı Tebliğ Tarihi

↓

İş Kuralı

↓

Süre Hesabı

↓

Dashboard Güncelle

↓

Bildirim Oluştur

---

## 9.5 Kesinleşme Algoritması

Koşullar

1. Tüm taraflara başarılı tebliğ yapılmış olmalıdır.

2. Başvuru bulunmamalıdır.

3. Son başarılı tebliğ tarihi esas alınmalıdır.

4. 14 günlük süre dolmalıdır.

Sonuç

READY_FOR_FINALIZATION

---

## 9.6 İstinaf Algoritması

Başvuran taraf belirlenir.

Karşı taraflar otomatik seçilir.

Karşı tarafların tamamına başarılı tebliğ yapılmalıdır.

Son başarılı tebliğ esas alınır.

14 gün beklenir.

Sonuç

READY_FOR_APPEAL_TRANSFER

---

## 9.7 Harç Algoritması

Harç borçlusu belirlenir.

Harç bildirimi tebliğ edilir.

1 aylık ödeme süresi beklenir.

Ödeme yapılmadıysa

15 günlük müzekkere süreci başlatılır.

Sistem yalnızca uyarı üretir.

---

## 9.8 Hesaplama Sonuçları

Motor aşağıdaki durumları üretebilir.

- Bekleniyor
- Eksik Bilgi
- Süre Başladı
- Süre Yaklaşıyor
- Süre Doldu
- Kesinleşmeye Hazır
- Üst Mahkemeye Gönderilmeye Hazır
- Harç Müzekkeresi Gerekli

---

## 9.9 Olaylar (Events)

- ServiceAdded
- ServiceUpdated
- AppealCreated
- FeePaid
- FileArchived
- FileRestored

Her olay sonrası motor yeniden hesaplama yapmalıdır.

---

## 9.10 Performans

- Hesaplamalar idempotent olmalıdır.
- Gereksiz tekrar hesaplama yapılmamalıdır.
- Toplu yeniden hesaplama desteklenmelidir.
- Arka planda çalışabilecek şekilde tasarlanmalıdır.

---

## 9.11 Hata Yönetimi

- Eksik veri
- Geçersiz tarih
- Tutarsız taraf
- Silinmiş kayıt referansı

Bu durumlar hata yerine "Eksik Bilgi" sonucu üretmelidir.

---

## 9.12 Test Senaryoları

TS-01
Tek davacı, tek davalı.
14 gün doldu.
Başvuru yok.
Beklenen:
READY_FOR_FINALIZATION

TS-02
İade tebligat.
Beklenen:
Süre başlamaz.

TS-03
Sekiz davalı.
Son tebliğ tarihi esas alınır.

TS-04
Harç ödenmedi.
Beklenen:
Harç müzekkeresi önerisi.

---

## 9.13 Kodlama Ajanı Notları

- Tüm algoritmalar saf (pure) fonksiyon mantığıyla yazılmalıdır.
- İş kuralları konfigüre edilebilir olmalıdır.
- Motor servis katmanında bağımsız bir bileşen olarak tasarlanmalıdır.
- Gelecekte zamanlayıcı (scheduler) ile periyodik çalışabilecek mimari kurulmalıdır.

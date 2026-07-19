
# Bölüm 03 — İş Kuralları (Business Rules)

## 3.1 Amaç

Bu bölüm sistemin uyması zorunlu olan iş kurallarını tanımlar. Bu kurallar değiştirilemez ve
uygulamanın tüm katmanlarında referans alınmalıdır.

---

## 3.2 Temel Prensipler

BR-001: Sistem hiçbir hukuki işlemi otomatik gerçekleştirmez.

BR-002: Sistem yalnızca hesaplar, doğrular, uyarır ve öneride bulunur.

BR-003: Nihai işlem yalnızca Yazı İşleri Müdürü tarafından başlatılır.

BR-004: Tüm kritik işlemler Audit Log'a kaydedilir.

BR-005: Tüm tarih hesaplamaları tek bir merkezi servis tarafından yapılmalıdır.

---

## 3.3 Tebligat Kuralları

BR-010
Her taraf için bağımsız tebligat geçmişi tutulacaktır.

BR-011
İade edilen tebligat süre başlatmaz.

BR-012
Başarılı tebliğ tarihi olmadan hiçbir süre hesaplanamaz.

BR-013
Yeni tebligat oluşturulduğunda eski kayıt silinmez.

BR-014
Tebligat geçmişi değiştirilemez, yalnızca yeni kayıt eklenebilir.

---

## 3.4 Süre Hesaplama Kuralları

BR-020
Süre son başarılı tebliğ tarihinden başlar.

BR-021
Çok taraflı dosyalarda en son başarılı tebliğ tarihi esas alınır.

BR-022
Eksik tebligat bulunan dosyada süre hesaplanmaz.

BR-023
İade edilen tebligatlar hesaba katılmaz.

---

## 3.5 Kesinleşme Kuralları

BR-030
Tüm taraflara başarılı tebligat yapılmalıdır.

BR-031
Kanun yolu başvurusu bulunmamalıdır.

BR-032
14 günlük yasal süre dolmalıdır.

BR-033
Koşullar sağlandığında sistem yalnızca "Kesinleşmeye Hazır" durumunu üretir.

---

## 3.6 İstinaf / Temyiz Kuralları

BR-040
Başvuran taraf karşı taraf listesinde yer alamaz.

BR-041
Karşı tarafların tamamına tebligat yapılmadan dosya gönderilmeye hazır sayılmaz.

BR-042
Süre karşı tarafın son başarılı tebliğ tarihinden başlar.

---

## 3.7 Veri Doğrulama

BR-050
Karar tarihi gelecekte olamaz.

BR-051
Tebliğ tarihi çıkış tarihinden önce olamaz.

BR-052
Kesinleşme tarihi manuel girilecekse hesaplanan tarihten önce olamaz.

BR-053
Zorunlu alanlar boş bırakılarak dosya kaydedilemez.

---

## 3.8 Yetkilendirme

BR-060
Yetki mahkeme bazlıdır.

BR-061
Dosya bazlı yetkilendirme yoktur.

BR-062
Yetkisi kaldırılan kullanıcı ilgili mahkemeye anında erişimini kaybeder.

---

## 3.9 Bildirim Kuralları

BR-070
Yaklaşan süreler sarı uyarı üretir.

BR-071
Geçen süreler kırmızı uyarı üretir.

BR-072
Tamamlanan görevler yeşil olarak gösterilir.

---

## 3.10 Denetim

Aşağıdaki işlemler loglanacaktır:

- Giriş
- Çıkış
- Dosya oluşturma
- Dosya güncelleme
- Tebligat ekleme
- Başvuru ekleme
- Yetki değişiklikleri
- Manuel kesinleşme
- Manuel üst mahkemeye gönderme

Log kayıtları silinemez.

---

## 3.11 Edge Case Listesi

- Aynı gün birden fazla tebligat
- Yanlış girilmiş tebliğ tarihi
- Sonradan eklenen taraf
- İptal edilen karar
- Yetkisi kaldırılan kullanıcı
- Arşive alınmış dosya
- Tekrar açılan dosya
- Eksik taraf bilgisi
- Birden fazla başvuru
- Mükerrer tebligat

Her edge-case için ilerleyen bölümlerde ayrı test senaryosu hazırlanacaktır.

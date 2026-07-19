# Bölüm 02 --- Hukuk Mahkemesi İş Akışları

> Bu bölüm, konuşmada tanımlanan hukuk mahkemesi süreçlerini yazılım
> gereksinimine dönüştürür.

# 2.1 Amaç

Bu modül, hukuk mahkemelerinde karar sonrası süreçlerin güvenli şekilde
takip edilmesini sağlar. Sistem hiçbir işlemi otomatik tamamlamaz;
yalnızca hesaplar, doğrular ve önerir.

------------------------------------------------------------------------

# 2.2 Karar Sonrası Yaşam Döngüsü

    Karar Verildi
          │
          ▼
    Müdüre Teslim
          │
          ▼
    Taraflara Tebligat
          │
          ▼
    Tebliğ Süreleri Takip Edilir
          │
          ├── Başvuru Yok
          │       ▼
          │  Kesinleşmeye Hazır
          │
          └── İstinaf / Temyiz
                  ▼
    Karşı Tarafa Tebligat
                  ▼
    İki Haftalık Süre
                  ▼
    Üst Mahkemeye Gönderilmeye Hazır

------------------------------------------------------------------------

# 2.3 Dosya Oluşturulduğunda

Zorunlu alanlar

-   Mahkeme
-   Esas No
-   Karar No
-   Karar Tarihi
-   Karar Sonucu
-   Kanun Yolu
-   Davacılar
-   Davalılar

------------------------------------------------------------------------

# 2.4 İlk Tebligat Süreci

Karar yazıldıktan sonra gerekçeli karar taraflara tebliğe çıkarılır.

Her taraf için ayrı kayıt tutulur.

Alanlar

-   Taraf
-   Tebligat No
-   Çıkış Tarihi
-   Durum
    -   Bekliyor
    -   Tebliğ Edildi
    -   İade
-   Tebliğ Tarihi

Not: Tebliğ tarihi yalnızca başarılı tebliğde doldurulur.

------------------------------------------------------------------------

# 2.5 Kesinleşme Algoritması

Koşullar

1.  Tüm taraflara başarılı tebliğ yapılmış olmalıdır.
2.  Son başarılı tebliğ tarihi bulunmalıdır.
3.  Son tebliğ tarihinden itibaren 14 gün beklenir.
4.  Bu sürede istinaf veya temyiz başvurusu olmamalıdır.

Sonuç

Sistem:

"Dosya kesinleşmeye hazır."

uyarısı üretir.

Kesinleşme tarihi otomatik yazılmaz.

------------------------------------------------------------------------

# 2.6 Çok Taraflı Dosyalar

## Örnek

Davacı

-   Ahmet

Davalılar

-   Mehmet
-   Ayşe
-   Ali

Tebliğ Tarihleri

Mehmet : 01.08

Ayşe : 05.08

Ali : 10.08

Süre hesabı 10.08 tarihinden başlar.

En son tebliğ edilen taraf esas alınır.

------------------------------------------------------------------------

# 2.7 İstinaf Süreci

Başvuran taraf seçilir.

Kurallar

Davacı başvurduysa

→ yalnızca davalılar listelenir.

Davalı başvurduysa

→ yalnızca davacılar listelenir.

Karşı taraflara yeni tebligat oluşturulur.

Her karşı taraf için ayrı tebligat geçmişi tutulur.

Tüm karşı tarafların tebliğ süreleri tamamlandıktan sonra sistem

"Dosya istinafa gönderilmeye hazır."

uyarısı verir.

Gönderme işlemini müdür yapar.

------------------------------------------------------------------------

# 2.8 Temyiz Süreci

İşleyiş istinaf ile aynıdır.

Fark

Üst mahkeme Yargıtay'dır.

İş kuralları değişmez.

------------------------------------------------------------------------

# 2.9 İade Tebligat

İade tebligat süre başlatmaz.

Yeni tebligat oluşturulmalıdır.

Sistem

"Tebligat iade edildi. Süre başlamadı."

uyarısını gösterir.

------------------------------------------------------------------------

# 2.10 Validasyon Kuralları

-   Başarılı tebliğ olmadan süre başlamaz.
-   Tüm taraflara tebliğ yapılmadan kesinleşmeye hazır önerisi
    üretilemez.
-   Tüm karşı taraflara tebliğ yapılmadan üst mahkemeye gönderme önerisi
    üretilemez.
-   Tebliğ tarihi çıkış tarihinden önce olamaz.
-   İade tebligatta tebliğ tarihi zorunlu değildir.

------------------------------------------------------------------------

# 2.11 Test Senaryoları

## Senaryo 1

Tek davacı Tek davalı

İki tarafa tebliğ edildi.

14 gün doldu.

Başvuru yok.

Beklenen sonuç:

Kesinleşmeye hazır.

------------------------------------------------------------------------

## Senaryo 2

Tek davacı

8 davalı

Son davalıya tebliğ:

20 Ağustos

Beklenen:

Süre 20 Ağustos'tan başlar.

------------------------------------------------------------------------

## Senaryo 3

Davacı istinaf etti.

Sistem yalnızca davalıları göstermelidir.

------------------------------------------------------------------------

## Senaryo 4

Tebligat iade döndü.

Beklenen:

Süre başlamaz.

Yeni tebligat gerekir.

------------------------------------------------------------------------

# 2.12 Kodlama Ajanı Notları

-   Süre hesaplamaları servis katmanında yapılmalıdır.
-   Tüm tarih hesaplamaları merkezi bir zaman servisi üzerinden
    yürütülmelidir.
-   İş kuralları UI katmanına yazılmamalıdır.
-   Her algoritma için birim testleri hazırlanmalıdır.

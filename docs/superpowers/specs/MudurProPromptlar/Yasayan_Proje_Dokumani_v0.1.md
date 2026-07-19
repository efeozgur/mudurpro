# Yazı İşleri Müdürü Süre Takip Sistemi

# Yazılım Gereksinimleri Dokümanı (SRS)

> **Durum:** Yaşayan Doküman\
> **Sürüm:** 0.1\
> **Belge Türü:** Kodlama ajanları (Codex, Claude Code, Cursor vb.) için
> hazırlanmış teknik gereksinim dokümanı.

------------------------------------------------------------------------

# 1. Projenin Amacı

Bu proje, Türkiye genelindeki adliyelerde görev yapan Yazı İşleri
Müdürlerinin;

-   süreleri kaçırmasını önlemek,
-   iş yükünü azaltmak,
-   süreçleri standartlaştırmak,
-   insan kaynaklı hataları azaltmak,
-   dosya yaşam döngüsünü güvenli biçimde takip etmek

amacıyla geliştirilecek web tabanlı çok kullanıcılı (multi-tenant) bir
uygulamadır.

------------------------------------------------------------------------

# 2. Temel Tasarım Felsefesi

## En önemli kural

**Sistem hiçbir zaman kullanıcı yerine karar vermez.**

Sistem;

-   hesaplar,
-   kontrol eder,
-   öneride bulunur,
-   uyarı üretir.

Ancak;

-   kesinleşme,
-   üst mahkemeye gönderme,
-   harç tahsil müzekkeresi,
-   dosya tamamlama

işlemlerinin tamamı Yazı İşleri Müdürü tarafından manuel olarak
yapılacaktır.

Bu kural tüm proje boyunca değiştirilmeyecektir.

------------------------------------------------------------------------

# 3. Hedef Kullanıcılar

## Süper Admin

Sistemin tamamını yönetir.

Görevleri:

-   Adliye oluşturmak
-   Adliye yöneticisi atamak
-   Sistem loglarını incelemek
-   Sistem sağlığını takip etmek
-   Tüm sistemi yedeklemek

------------------------------------------------------------------------

## Adliye Admini

Sadece kendi adliyesini yönetebilir.

Yetkileri:

-   Mahkeme oluşturma
-   Mahkemeleri düzenleme
-   Müdür oluşturma
-   Müdüre mahkeme atama
-   Yetki kaldırma
-   Kendi adliyesinin yedeğini alma

------------------------------------------------------------------------

## Yazı İşleri Müdürü

Yalnızca yetkili olduğu mahkemeleri görebilir.

**Yetkilendirme dosya bazlı değildir.**

Yetkilendirme yalnızca **mahkeme bazlıdır.**

Örnek:

Yetkili Mahkemeler

-   1.  Asliye Hukuk
-   Aile Mahkemesi

Bu kullanıcı yalnızca bu mahkemelerin tüm dosyalarını görebilir.

------------------------------------------------------------------------

# 4. Projenin Kapsamı

İlk sürüm aşağıdaki modülleri içerecektir.

-   Kimlik doğrulama
-   Rol yönetimi
-   Adliye yönetimi
-   Mahkeme yönetimi
-   Dosya yönetimi
-   Taraf yönetimi
-   Tebligat takibi
-   Kesinleşme takibi
-   İstinaf süreci
-   Temyiz süreci
-   Harç takip sistemi
-   Dashboard
-   Bildirim sistemi
-   Denetim kayıtları
-   Yedekleme

------------------------------------------------------------------------

# 5. Kapsam Dışı

İlk sürümde aşağıdakiler bulunmayacaktır.

-   UYAP entegrasyonu
-   SMS entegrasyonu
-   E-posta entegrasyonu
-   Mobil uygulama

------------------------------------------------------------------------

# 6. Genel İş Kuralları

1.  Süreler başarılı tebliğ tarihinden başlar.
2.  İade tebligat süre başlatmaz.
3.  Sistem yalnızca öneri üretir.
4.  Nihai işlem kullanıcı tarafından yapılır.
5.  Bütün kritik işlemler Audit Log'a yazılır.
6.  Tarih tutarsızlıkları kaydedilmeden önce doğrulanır.

------------------------------------------------------------------------

# 7. Geliştirme Kuralları (Kodlama Ajanı İçin)

Bu proje geliştirilirken aşağıdaki kurallara uyulacaktır.

-   Katmanlı mimari kullanılacaktır.
-   Temiz kod prensipleri uygulanacaktır.
-   SOLID prensipleri uygulanacaktır.
-   Her modül bağımsız geliştirilecektir.
-   Her modül için test yazılacaktır.
-   Bir modül tamamlanmadan sonraki modüle geçilmeyecektir.
-   Tüm iş kuralları servis katmanında uygulanacaktır.
-   UI hiçbir iş kuralı içermeyecektir.

------------------------------------------------------------------------

# 8. Yaşayan Doküman Kuralı

Bu belge sürekli güncellenecektir.

Bir sonraki sürümde eklenecek bölüm:

**Bölüm 02 --- Hukuk Mahkemesi İş Akışları**

Bu bölümde aşağıdakiler ayrıntılı olarak tanımlanacaktır:

-   Karar süreci
-   Tebligat süreci
-   Kesinleşme
-   İstinaf
-   Temyiz
-   Çok davalı senaryoları
-   Çok davacı senaryoları
-   Tebligat iadesi
-   Süre hesaplama algoritmaları
-   Edge-case senaryoları

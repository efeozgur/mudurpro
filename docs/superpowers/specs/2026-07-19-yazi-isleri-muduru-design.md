# Yazı İşleri Müdürü Süre Takip Sistemi - Tasarım Dokümanı

> **Durum:** Onaylanmış Tasarım
> **Sürüm:** 0.1
> **Tarih:** 2026-07-19
> **Referans:** SRS (Yazılım Gereksinimleri Dokümanı) v0.1

---

## 1. Proje Özeti

Türkiye genelindeki adliyelerde görev yapan Yazı İşleri Müdürlerinin süreleri kaçırmasını önlemek, iş yükünü azaltmak ve dosya yaşam döngüsünü güvenli biçimde takip etmek amacıyla geliştirilecek web tabanlı çok kullanıcılı (multi-tenant) bir uygulamadır.

### Temel Kural (Değiştirilemez)

**Sistem hiçbir zaman kullanıcı yerine karar vermez.** Sistem hesap yapar, kontrol eder, öneride bulunur, uyarı üretir. Ancak tüm nihai işlemler (kesinleşme, üst mahkemeye gönderme, harç tahsil müzekkeresi, dosya tamamlama) kullanıcı tarafından manuel olarak yapılır.

---

## 2. Hedef Kullanıcılar

| Rol | Yetki Alanı | Görevler |
|---|---|---|
| **Süper Admin** | Tüm sistem | Adliye oluşturma, admin atama, sistem logları, yedekleme |
| **Adliye Admini** | Kendi adliyesi | Mahkeme oluşturma, müdür ekleme/atama, adliye yedeği |
| **Yazı İşleri Müdürü** | Atandığı mahkemeler | Dosya takibi, tebligat işlemleri, süre ve harç takibi |

Yetkilendirme **mahkeme bazlıdır**, dosya bazlı değildir. Bir müdür yalnızca atandığı mahkemelerin tüm dosyalarını görebilir.

---

## 3. Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
|---|---|---|
| **Frontend** | React (Vite) + TypeScript | Modern SPA |
| **UI Kütüphanesi** | Tailwind CSS + shadcn/ui | Erişilebilir, profesyonel bileşenler |
| **State Management** | TanStack Query (React Query) | Sunucu verisi önbellekleme ve senkronizasyon |
| **Form Yönetimi** | React Hook Form + Zod | Karmaşık formlar ve validasyon |
| **Backend** | NestJS + TypeScript | Modüler, SOLID uyumlu sunucu tarafı |
| **Veritabanı** | PostgreSQL | İlişkisel, şema bazlı multi-tenancy |
| **Auth** | JWT (JSON Web Token) | Kimlik doğrulama ve tenant yönlendirme |
| **Altyapı** | Docker & Docker Compose | Konteynerleştirme ve orkestrasyon |

### Docker Servisleri

| Servis | İçerik |
|---|---|
| `app` | Backend (NestJS) |
| `web` | Frontend (React, Nginx ile servis edilecek) |
| `db` | PostgreSQL veritabanı |
| `pgadmin` | Veritabanı yönetim arayüzü (geliştirme) |

---

## 4. Mimari

### 4.1 Modüler Monolit (NestJS)

Tüm backend tek bir NestJS uygulamasında toplanır. Modüller birbirinden kesin çizgilerle ayrılır:

```
src/
  modules/
    auth/           # Kimlik doğrulama, JWT, tenant yönlendirme
    adliye/         # Adliye CRUD, şema oluşturma
    mahkeme/        # Mahkeme CRUD, müdür atama
    dosya/          # Dosya kaydı, durum yönetimi
    taraf/          # Davacı/davalı yönetimi
    tebligat/       # Tebliğ kaydı, sonuç takibi
    sure/           # Süre hesaplama motoru
    harc/           # Harç kaydı ve tahsilat takibi
    bildirim/       # Kritik süre uyarıları
    audit/          # Denetim kayıtları (Audit Log)
  common/
    decorators/     # Tenant, rol dekoratörleri
    guards/         # JWT, rol, tenant guard'ları
    interceptors/   # Tenant şema yönlendirme
    filters/        # Hata filtreleri
    pipes/          # Validasyon
```

### 4.2 Tenant Interceptor (Şema Yönlendirme)

Gelen her HTTP isteğinde:
1. JWT token çözülür → kullanıcı ID ve `adliye_id` elde edilir
2. `adliye_id` ile `public.adliyeler` tablosundan `schema_name` alınır
3. Veritabanı bağlantısı ilgili şemaya (`adliye_<id>`) yönlendirilir
4. Tüm sorgular bu şema içinde çalışır

### 4.3 Tüm İş Kuralları Servis Katmanında

UI hiçbir iş kuralı içermez. Tüm hukuki hesaplamalar, validasyonlar ve süreç mantığı NestJS servis katmanında uygulanır.

---

## 5. Veritabanı Tasarımı

### 5.1 Multi-Tenancy: Shared Database, Separate Schema

| Şema | Kapsam | İçerik |
|---|---|---|
| `public` | Global | Adliyeler, kullanıcılar, adliye yöneticileri |
| `adliye_<id>` | Adliye özel | Mahkemeler, müdürler, dosyalar, tebligatlar, süreler, harçlar |

### 5.2 `public` Şeması (Global Yönetim)

```sql
CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE public.adliyeler (
  id            SERIAL PRIMARY KEY,
  ad            VARCHAR(255) NOT NULL,
  sehir         VARCHAR(100),
  vergi_no      VARCHAR(50),
  schema_name   VARCHAR(100) UNIQUE NOT NULL,  -- adliye_<id>
  aktif         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kullanicilar (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(50) NOT NULL CHECK (rol IN ('SUPER_ADMIN', 'ADLIYE_ADMIN', 'MUDUR')),
  ad_soyad      VARCHAR(255),
  aktif         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.adliye_yoneticileri (
  id            SERIAL PRIMARY KEY,
  kullanici_id  INT REFERENCES public.kullanicilar(id),
  adliye_id     INT REFERENCES public.adliyeler(id),
  UNIQUE(kullanici_id, adliye_id)
);
```

### 5.3 `adliye_<id>` Şeması (Adliye Özel Veri)

Her yeni adliye oluşturulduğunda aşağıdaki tabloları içeren bir şema oluşturulur:

```sql
CREATE SCHEMA IF NOT EXISTS adliye_<id>;

-- Mahkemeler
CREATE TABLE adliye_<id>.mahkemeler (
  id            SERIAL PRIMARY KEY,
  ad            VARCHAR(255) NOT NULL,
  tur           VARCHAR(100),  -- Asliye Hukuk, Aile, İcra vb.
  aktif         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Müdür-Mahkeme Ataması
CREATE TABLE adliye_<id>.mudur_mahkeme (
  id            SERIAL PRIMARY KEY,
  kullanici_id  INT NOT NULL,  -- public.kullanicilar.id
  mahkeme_id    INT REFERENCES adliye_<id>.mahkemeler(id),
  UNIQUE(kullanici_id, mahkeme_id)
);

-- Dosyalar
CREATE TABLE adliye_<id>.dosyalar (
  id            SERIAL PRIMARY KEY,
  esas_no       VARCHAR(50) NOT NULL,
  karar_no      VARCHAR(50),
  mahkeme_id    INT REFERENCES adliye_<id>.mahkemeler(id),
  durum         VARCHAR(50) DEFAULT 'AKTIF',
  aciklama      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Taraflar
CREATE TABLE adliye_<id>.taraflar (
  id            SERIAL PRIMARY KEY,
  dosya_id      INT REFERENCES adliye_<id>.dosyalar(id) ON DELETE CASCADE,
  taraf_turu    VARCHAR(20) CHECK (taraf_turu IN ('DAVACI', 'DAVALI', 'FERI_MUDAHIL')),
  ad_soyad      VARCHAR(255),
  kimlik_no     VARCHAR(50),
  vekil_var_mi  BOOLEAN DEFAULT FALSE
);

-- Tebligatlar
CREATE TABLE adliye_<id>.tebligatlar (
  id            SERIAL PRIMARY KEY,
  dosya_id      INT REFERENCES adliye_<id>.dosyalar(id) ON DELETE CASCADE,
  taraf_id      INT REFERENCES adliye_<id>.taraflar(id),
  tur           VARCHAR(50),         -- Karar, Dava Dilekçesi, Gerekçeli Karar vb.
  gonderim_tarihi   DATE,
  teblig_tarihi     DATE,           -- Başarılı tebliğ tarihi
  sonuc         VARCHAR(50) DEFAULT 'BEKLEMEDE',  -- BEKLEMEDE, BASARILI, IADE, TEBELLUG
  aciklama      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Süreler (Sistem tarafından otomatik hesaplanır)
CREATE TABLE adliye_<id>.sureler (
  id            SERIAL PRIMARY KEY,
  dosya_id      INT REFERENCES adliye_<id>.dosyalar(id) ON DELETE CASCADE,
  tebligat_id   INT REFERENCES adliye_<id>.tebligatlar(id),
  tur           VARCHAR(50),         -- ISTINAF_BASVURU, TEMYIZ_BASVURU, KARAR_DUZELTME vb.
  baslangic_tarihi  DATE NOT NULL,
  bitis_tarihi      DATE NOT NULL,
  kalan_gun     INT,
  durum         VARCHAR(50) DEFAULT 'AKTIF',  -- AKTIF, TAMAMLANAN, GECILEN
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Harçlar
CREATE TABLE adliye_<id>.harclar (
  id            SERIAL PRIMARY KEY,
  dosya_id      INT REFERENCES adliye_<id>.dosyalar(id) ON DELETE CASCADE,
  tur           VARCHAR(50),         -- BASVURU, KARAR, ISTINAF, TEMYIZ
  tutar         DECIMAL(12,2) NOT NULL,
  durum         VARCHAR(50) DEFAULT 'BEKLIYOR',  -- BEKLIYOR, ODENDI, MUZEKKERE_YAZILDI
  odeme_tarihi  DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Denetim Kayıtları (Audit Log)
CREATE TABLE adliye_<id>.audit_logs (
  id            SERIAL PRIMARY KEY,
  kullanici_id  INT NOT NULL,
  eylem         VARCHAR(100) NOT NULL,
  tablo_adi     VARCHAR(100),
  kayit_id      INT,
  eski_deger    JSONB,
  yeni_deger    JSONB,
  ip_adresi     VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.4 İlişki Özeti

```
adliyeler 1──N adliye_yoneticileri N──1 kullanicilar
adliyeler 1──N adliye_<id>.mahkemeler
mahkemeler 1──N mudur_mahkeme N──1 kullanicilar
mahkemeler 1──N dosyalar
dosyalar 1──N taraflar
dosyalar 1──N tebligatlar
taraflar 1──N tebligatlar
tebligatlar 1──1 sureler
dosyalar 1──N harclar
```

---

## 6. Modüller ve API Tasarımı

### 6.1 Modül Sorumlulukları

| Modül | Sorumluluk | Bağımlılık |
|---|---|---|
| `AuthModule` | Giriş, JWT üretimi, şifre yönetimi | `public.kullanicilar` |
| `AdliyeModule` | Adliye CRUD, şema oluşturma | Yeni PostgreSQL şeması oluşturur |
| `MahkemeModule` | Mahkeme CRUD, müdür mahkemeye atama | `adliye_<id>.mahkemeler` |
| `DosyaModule` | Dosya kaydı, durum güncelleme, listeleme | `adliye_<id>.dosyalar` |
| `TarafModule` | Davacı/davalı ekleme, vekil bilgisi | `adliye_<id>.taraflar` |
| `TebligatModule` | Tebliğ kaydı, sonuç girişi → süre motorunu tetikler | `adliye_<id>.tebligatlar` |
| `SureModule` | **Süre hesaplama motoru**, takvim verisi | `adliye_<id>.sureler` |
| `HarcModule` | Harç kaydı, ödeme takibi | `adliye_<id>.harclar` |
| `BildirimModule` | Kritik süre uyarıları, dashboard bildirimleri | `adliye_<id>.sureler` |
| `AuditModule` | Denetim kayıtları okuma | `adliye_<id>.audit_logs` |

### 6.2 API Endpoint'leri

```
# Auth
POST   /api/auth/login              # Giriş
POST   /api/auth/refresh            # Token yenileme
POST   /api/auth/sifre-degis        # Şifre değiştirme

# Adliye (Süper Admin)
GET    /api/adliyeler               # Tüm adliyeler
POST   /api/adliyeler               # Yeni adliye (şema oluşturur)
PUT    /api/adliyeler/:id
DELETE /api/adliyeler/:id

# Mahkeme (Adliye Admin)
GET    /api/mahkemeler
POST   /api/mahkemeler
PUT    /api/mahkemeler/:id
POST   /api/mahkemeler/:id/mudur    # Müdür atama
DELETE /api/mahkemeler/:id/mudur    # Müdür çıkarma

# Dosya
GET    /api/dosyalar                # Liste (filtreli, sayfalı)
GET    /api/dosyalar/:id            # Detay
POST   /api/dosyalar                # Yeni dosya
PUT    /api/dosyalar/:id
GET    /api/dosyalar/:id/gecmis     # Dosya işlem geçmişi

# Taraf
GET    /api/dosyalar/:id/taraflar
POST   /api/dosyalar/:id/taraflar
PUT    /api/taraflar/:id
DELETE /api/taraflar/:id

# Tebligat
GET    /api/dosyalar/:id/tebligatlar
POST   /api/tebligatlar
PUT    /api/tebligatlar/:id/sonuc    # Sonuç girişi → süre motoruna tetikler

# Süre
GET    /api/sureler                  # Süre listesi (filtreli)
GET    /api/sureler/hesapla          # Manuel süre hesaplama (parametrik)
GET    /api/sureler/takvim           # Takvim görünümü için veri
GET    /api/sureler/kritik           # Yaklaşan kritik süreler

# Harç
GET    /api/dosyalar/:id/harclar
POST   /api/harclar
PUT    /api/harclar/:id/odeme        # Ödeme/tahsilat kaydı

# Bildirim
GET    /api/bildirimler              # Kullanıcıya özel bildirimler
PUT    /api/bildirimler/:id/okundu

# Audit
GET    /api/audit-logs               # Denetim kayıtları

# Dashboard
GET    /api/dashboard/istatistikler  # Özet istatistikler
GET    /api/dashboard/kritik-dosyalar # Süresi yaklaşan dosyalar
```

### 6.3 Süre Hesaplama Motoru (SureModule)

Motor, tebligat sonucu "Başarılı" olarak girildiğinde otomatik tetiklenir.

**Kurallar:**
1. Süreler başarılı tebliğ tarihinden başlar
2. İade tebligat süre başlatmaz
3. Mahkeme türüne göre varsayılan süreler:
   - İstinaf başvuru: 2 hafta
   - Temyiz başvuru: 1 ay
   - Karar düzeltme: 15 gün
4. Adli tatil ve resmi tatil günleri hesaplamaya dahil edilir
5. İş günü bitimine kalan gün sayısı günlük olarak güncellenir
6. Kalan gün sayısına göre uyarı seviyesi:
   - 0 gün: **Geçmiş** (Kırmızı)
   - 1-3 gün: **Kritik** (Kırmızı)
   - 4-7 gün: **Yaklaşıyor** (Turuncu)
   - 8-14 gün: **Takip** (Sarı)
   - 15+ gün: **Normal** (Yeşil)

---

## 7. Ekran Yapıları ve Kullanıcı Akışı

### 7.1 Giriş Ekranı
- E-posta ve şifre ile giriş
- Şifremi unuttum desteği
- JWT token üretimi

### 7.2 Süper Admin Paneli
- **Adliye Yönetimi:** Tablo görünümü, yeni adliye ekleme butonu (şema oluşturmayı tetikler)
- **Sistem Logları:** Audit log izleme
- **Sistem Sağlığı:** Aktif kullanıcı sayısı, toplam dosya vb.

### 7.3 Adliye Admin Paneli
- **Mahkeme Yönetimi:** Mahkeme listesi, ekleme/düzenleme
- **Müdür Yönetimi:** Müdür ekleme, mahkemelere atama
- **Adliye İstatistikleri:** Dosya sayısı, süre durumu özeti

### 7.4 Müdür Paneli (Dashboard)
- **İstatistik Kartları:**
  - Kritik Süreler (son 3 gün) — Kırmızı
  - Bekleyen Tebligatlar — Turuncu
  - Kesinleşme Bekleyen — Mavi
  - Tahsilat Bekleyen Harç — Yeşil
- **Süre Takip Listesi:** Esas no, taraf bilgisi, işlem türü, kalan gün, durum rozeti, detay butonu
- **Sistem Öneri Kutusu:** Mavi bilgi kutusu — sistemin otomatik hesapladığı öneri (örn: "İstinaf süresi yarın doluyor")
- **Filtreleme ve Dışa Aktarma**

### 7.5 Dosya Detay Sayfası
- Dosya bilgileri (esas no, karar no, mahkeme)
- Taraflar listesi
- Tebligat geçmişi (zaman çizelgesi)
- Hesaplanan süreler
- Harç durumu
- İşlem geçmişi (audit log)

### 7.6 Süre Takvimi
- Ay/yıl görünümünde kritik tarihler
- Renk kodlaması ile süre durumları

---

## 8. İş Akışları

### 8.1 Tebligat → Süre Zinciri

```
1. Kullanıcı tebligat kaydı oluşturur → Durum: "Gönderildi"
2. Kullanıcı tebligat sonucunu girer
   - "Başarılı" → Süre hesaplama motoru tetiklenir
   - "İade" → Süre başlatılmaz, yeniden tebligat gerekir
   - "Tebellüğ" → Süre başlatılır
3. Süre motoru mahkeme türüne göre süreyi hesaplar
4. Hesaplanan süre `sureler` tablosuna yazılır
5. Bildirim motoru kalan gün sayısına göre uyarı seviyesi belirler
6. Kalan gün < 7 → Dashboard bildirimi oluşturulur
7. Kullanıcı süre dolumunda manuel işlem yapar (kesinleştirme, istinaf gönderme vb.)
```

### 8.2 Harç Takip Zinciri

```
1. Kullanıcı harç kaydı oluşturur → Durum: "Bekliyor"
2. Harç tahsil edildiğinde → Kullanıcı "Ödendi" olarak işaretler
3. Harç tahsil edilemezse → Kullanıcı "Müzekkere Yazıldı" olarak işaretler
4. Tüm harçlar ödenmeden üst mahkemeye gönderme önerilmez
```

---

## 9. Kapsam Dışı (İlk Sürüm)

- UYAP entegrasyonu
- SMS entegrasyonu
- E-posta entegrasyonu
- Mobil uygulama

---

## 10. Geliştirme Kuralları

- Katmanlı mimari kullanılacaktır
- Temiz kod prensipleri uygulanacaktır
- SOLID prensipleri uygulanacaktır
- Her modül bağımsız geliştirilecektir
- Her modül için test yazılacaktır
- Bir modül tamamlanmadan sonraki modüle geçilmeyecektir
- Tüm iş kuralları servis katmanında uygulanacaktır
- UI hiçbir iş kuralı içermeyecektir
- Bütün kritik işlemler Audit Log'a yazılacaktır
- Tarih tutarsızlıkları kaydedilmeden önce doğrulanacaktır
- Finansal verilerde farklı para birimleri tek bir toplamda birleştirilmeyecektir

---

## 11. Riskler ve Önlemler

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| Yanlış süre hesaplama | Orta | Yüksek | Süre motoru kapsamlı test edilecek, test senaryoları oluşturulacak |
| Şema yönlendirme hatası | Düşük | Yüksek | Tenant Interceptor testleri, hata durumunda 403 dönecek |
| Veri sızıntısı (adliyeler arası) | Düşük | Kritik | PostgreSQL RLS ve şema izolasyonu, audit log ile takip |
| Performans (çok adliye) | Düşük | Orta | Connection pooling, sorgu optimizasyonu |

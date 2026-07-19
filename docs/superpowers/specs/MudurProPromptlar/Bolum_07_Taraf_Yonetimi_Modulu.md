# Bölüm 07 — Taraf Yönetimi Modülü

## 7.1 Amaç

Taraf Yönetimi Modülü, bir dava dosyasında yer alan davacı, davalı ve süreç içinde eklenebilecek diğer tarafların güvenli, izlenebilir ve sınırsız sayıda yönetilmesini sağlar.

Bu modül; tebligat, kanun yolu, harç takibi, kesinleşme ve üst mahkemeye gönderme süreçlerinin temel veri kaynağıdır. Taraf verilerindeki hata veya eksiklik, süre hesaplamalarının ve görev önerilerinin yanlış oluşmasına neden olabileceği için modül yüksek veri bütünlüğü kurallarıyla tasarlanmalıdır.

---

## 7.2 Temel İlkeler

- Bir dava dosyasında sınırsız sayıda taraf bulunabilir.
- Her taraf yalnızca bir dava dosyasına bağlıdır.
- Her tarafın dosya içindeki rolü açıkça belirtilmelidir.
- Taraf kaydı fiziksel olarak silinmez; pasife alınır veya dosyadan çıkarılma gerekçesiyle kapatılır.
- Tarafın geçmiş tebligat kayıtları korunur.
- Taraf rolü, aktif süreç varken doğrudan değiştirilemez.
- Aynı gerçek veya tüzel kişi, farklı dosyalarda bağımsız taraf kayıtlarıyla temsil edilir.
- Sistem taraf adına hukuki işlem yapmaz.

---

## 7.3 Desteklenen Taraf Rolleri

İlk sürümde aşağıdaki roller desteklenecektir:

- `PLAINTIFF` — Davacı
- `DEFENDANT` — Davalı

Gelecekte genişletilebilecek roller:

- Müdahil
- Şikâyetçi
- Katılan
- Sanık
- Mağdur
- Vekil
- Kanuni temsilci
- İlgili kişi

İlk sürümde iş kuralları yalnızca davacı ve davalı rollerine göre çalışacaktır.

---

## 7.4 Taraf Türleri

Her taraf aşağıdaki türlerden biri olmalıdır:

- `PERSON` — Gerçek kişi
- `ORGANIZATION` — Tüzel kişi / kurum

### Gerçek kişi alanları

| Alan | Zorunlu | Açıklama |
|---|---:|---|
| Ad | Evet | Kişinin adı |
| Soyad | Evet | Kişinin soyadı |
| T.C. Kimlik No | Hayır | İlk sürümde opsiyonel, hassas veri olarak korunur |
| Telefon | Hayır | Bildirim amacıyla değil, iletişim referansı olarak |
| E-posta | Hayır | İlk sürümde sistem bildirimi göndermez |
| Adres | Hayır | Tebligat adresi olarak kullanılabilir |
| Açıklama | Hayır | İç kullanım notu |

### Tüzel kişi alanları

| Alan | Zorunlu | Açıklama |
|---|---:|---|
| Kurum / Unvan | Evet | Resmî veya bilinen unvan |
| Vergi No | Hayır | Hassas veri olarak korunur |
| Yetkili Kişi | Hayır | Bilgi amaçlı |
| Telefon | Hayır | İletişim referansı |
| E-posta | Hayır | İlk sürümde sistem bildirimi göndermez |
| Adres | Hayır | Tebligat adresi |
| Açıklama | Hayır | İç kullanım notu |

---

## 7.5 Veri Modeli

Önerilen `parties` tablosu alanları:

| Alan | Tip | Kural |
|---|---|---|
| id | UUID | Primary Key |
| courthouse_id | UUID | Tenant izolasyonu için zorunlu |
| case_file_id | UUID | Foreign Key, zorunlu |
| party_type | varchar / enum | PERSON veya ORGANIZATION |
| role | varchar / enum | PLAINTIFF veya DEFENDANT |
| first_name | varchar(100) | Gerçek kişi için zorunlu |
| last_name | varchar(100) | Gerçek kişi için zorunlu |
| organization_name | varchar(250) | Tüzel kişi için zorunlu |
| national_id | varchar(11) | Şifreli veya maskeli tutulmalı |
| tax_number | varchar(20) | Şifreli veya maskeli tutulmalı |
| phone | varchar(30) | Opsiyonel |
| email | varchar(254) | Opsiyonel, format doğrulamalı |
| address | text | Opsiyonel |
| notes | text | Opsiyonel |
| is_active | boolean | Varsayılan true |
| removal_reason | text | Pasife alınırsa zorunlu olabilir |
| created_by | UUID | Kaydı oluşturan kullanıcı |
| updated_by | UUID | Son güncelleyen kullanıcı |
| created_at | timestamptz | Zorunlu |
| updated_at | timestamptz | Zorunlu |
| deleted_at | timestamptz | Soft delete için opsiyonel |

---

## 7.6 Taraf Oluşturma İş Akışı

1. Kullanıcı yetkili olduğu bir dosyayı açar.
2. `Taraf Ekle` işlemini başlatır.
3. Taraf rolünü seçer: Davacı veya Davalı.
4. Taraf türünü seçer: Gerçek kişi veya Tüzel kişi.
5. Zorunlu alanları doldurur.
6. Sistem veri doğrulamalarını çalıştırır.
7. Sistem aynı dosyada olası mükerrer kayıt kontrolü yapar.
8. Kullanıcı kaydı onaylar.
9. Taraf kaydı oluşturulur.
10. Audit Log kaydı yazılır.
11. Dosyanın taraf özeti ve ilgili süreç hesaplamaları yeniden değerlendirilir.

---

## 7.7 Taraf Güncelleme İş Akışı

Güncellenebilecek alanlar:

- İsim / unvan
- Telefon
- E-posta
- Adres
- Açıklama
- Kimlik veya vergi numarası

Kısıtlı alanlar:

- Dosya bağlantısı değiştirilemez.
- Aktif tebligat veya kanun yolu süreci varsa taraf rolü doğrudan değiştirilemez.
- Rol değişikliği gerekiyorsa yetkili kullanıcı gerekçe girmeli ve sistem bu işlemi özel bir düzeltme işlemi olarak kaydetmelidir.
- Geçmiş tebligatlarla bağlantılı taraf kaydı silinemez.

---

## 7.8 Tarafı Pasife Alma

Taraf kaydı fiziksel olarak silinmeyecektir.

Pasife alma nedenleri örnekleri:

- Yanlışlıkla eklenmiş kayıt
- Mükerrer kayıt
- Mahkeme kararıyla taraf sıfatının sona ermesi
- Dosya kapsamından çıkarılma
- Veri düzeltmesi amacıyla yeni kayıt oluşturulması

Kurallar:

- Pasife alma gerekçesi zorunludur.
- Aktif tebligat süreci varsa sistem uyarı verir ve işlemi engelleyebilir.
- Pasif taraf yeni süreçlere otomatik olarak dahil edilmez.
- Geçmiş süreçlerdeki bağlantılar korunur.
- İşlem Audit Log'a yazılır.

---

## 7.9 Mükerrer Kayıt Kontrolü

Sistem taraf kaydı oluşturulurken olası mükerrerleri kullanıcıya göstermelidir.

Kontrol kriterleri:

- Aynı dosyada aynı ad ve soyad
- Aynı dosyada aynı kurum unvanı
- Aynı T.C. Kimlik No
- Aynı vergi numarası
- Normalize edilmiş isim benzerliği

Sistem olası eşleşmeyi otomatik reddetmemelidir. Kullanıcıya uyarı göstermeli ve gerekçeli olarak devam etmesine izin vermelidir.

Örnek uyarı:

> Bu dosyada aynı veya benzer bilgilere sahip bir taraf kaydı bulunuyor. Kaydı kontrol ediniz.

---

## 7.10 Çok Taraflı Dosya Kuralları

- Bir dosyada birden fazla davacı ve birden fazla davalı olabilir.
- Karar tebligatı, dosyada aktif olan tüm taraflar için ayrı ayrı takip edilir.
- Kanun yolu başvurusunda karşı taraf listesi başvuran tarafın rolüne göre hesaplanır.
- Davacı başvurursa aktif davalılar karşı taraf kabul edilir.
- Davalı başvurursa aktif davacılar karşı taraf kabul edilir.
- Birden fazla başvuran varsa her başvuru bağımsız kayıt olarak tutulmalı; ancak tebligat yükümlülükleri mükerrer görev üretmeyecek şekilde birleştirilebilmelidir.
- Son tebliğ tarihi hesaplamasında yalnızca ilgili süreçte tebligat yapılması gereken aktif taraflar dikkate alınır.

---

## 7.11 Taraf ve Tebligat İlişkisi

Her tebligat kaydı doğrudan bir taraf kaydına bağlı olmalıdır.

Bir tarafın birden fazla tebligat geçmişi olabilir:

```text
Taraf
 ├─ Tebligat 1: İade
 ├─ Tebligat 2: İade
 └─ Tebligat 3: Tebliğ Edildi
```

Kurallar:

- İade kayıtları silinmez.
- Başarılı tebliğ tarihi yalnızca `SERVED` durumundaki kayıtta bulunur.
- Süre hesabı, ilgili süreçteki geçerli başarılı tebligat üzerinden yapılır.
- Taraf pasife alınsa bile geçmiş tebligatlar görünür kalır.

---

## 7.12 Taraf ve Kanun Yolu İlişkisi

Kanun yolu başvurusu oluşturulurken kullanıcı başvuran tarafı veya tarafları seçmelidir.

Sistem:

1. Başvuran tarafların rollerini belirler.
2. Karşı rol grubunu hesaplar.
3. Aktif karşı tarafları listeler.
4. Her karşı taraf için tebligat durumunu gösterir.
5. Tüm gerekli tebligatlar tamamlanmadan üst mahkemeye gönderilmeye hazır önerisi üretmez.

Aynı başvuruda hem davacı hem davalı taraf seçilmesine ilk sürümde izin verilmemelidir. Böyle bir durum ayrı başvuru kayıtlarıyla yönetilmelidir.

---

## 7.13 Taraf ve Harç İlişkisi

Harç borçlusu yalnızca dosyada aktif veya tarihsel olarak geçerli bir taraf arasından seçilebilir.

Kurallar:

- Borçlu taraf seçimi zorunludur.
- Pasif taraf seçilirse sistem uyarı verir.
- Borçlu taraf kaydı sonradan pasife alınsa bile harç takibi bağlantısı korunur.
- Harç modülü taraf adını kopyalamak yerine `party_id` üzerinden ilişki kurmalıdır.

---

## 7.14 Kullanıcı Arayüzü Gereksinimleri

### Taraf listesi

Her satırda en az şu bilgiler gösterilmelidir:

- Rol
- Ad soyad / kurum unvanı
- Taraf türü
- Aktif / pasif durumu
- Son tebligat durumu
- Eksik bilgi göstergesi
- İşlem menüsü

### Taraf ekleme formu

- Rol seçimi
- Taraf türü seçimi
- Dinamik alanlar
- Zorunlu alan işaretleri
- Mükerrer kayıt uyarısı
- Kaydet ve iptal işlemleri

### Taraf detay paneli

- Genel bilgiler
- Tebligat geçmişi
- Kanun yolu ilişkileri
- Harç ilişkileri
- İşlem geçmişi
- Audit Log özeti

---

## 7.15 Yetkilendirme Kuralları

- Yazı İşleri Müdürü yalnızca yetkili olduğu mahkemenin dosyalarındaki tarafları görüntüleyebilir ve düzenleyebilir.
- Adliye Admini taraf kayıtlarında işlem yapamaz; yalnızca sistemsel denetim amacıyla yetkisi varsa görüntüleyebilir.
- Super Admin taraf içeriklerinde işlem yapamaz.
- Tenant izolasyonu her sorguda `courthouse_id` üzerinden uygulanmalıdır.
- API seviyesinde mahkeme yetkisi yeniden doğrulanmalıdır; yalnızca UI gizlemesine güvenilmemelidir.

---

## 7.16 Validasyon Kuralları

`PV-001` Taraf rolü boş bırakılamaz.

`PV-002` Taraf türü boş bırakılamaz.

`PV-003` Gerçek kişi için ad ve soyad zorunludur.

`PV-004` Tüzel kişi için kurum unvanı zorunludur.

`PV-005` T.C. Kimlik No girilmişse 11 haneli ve yalnızca rakamlardan oluşmalıdır.

`PV-006` E-posta girilmişse geçerli e-posta biçiminde olmalıdır.

`PV-007` Taraf başka bir dosyaya taşınamaz.

`PV-008` Geçmiş tebligatı olan taraf fiziksel olarak silinemez.

`PV-009` Aktif başvuru sürecinde rol değişikliği yapılamaz.

`PV-010` Pasife alma işlemi gerekçesiz yapılamaz.

`PV-011` Tarafın bağlı olduğu dosya kullanıcının yetkili olduğu mahkemeye ait olmalıdır.

`PV-012` Aynı kimlik numarası aynı dosyada tekrar girilirse kullanıcı uyarılmalıdır.

---

## 7.17 API Gereksinimleri

Önerilen uç noktalar:

```http
GET    /cases/{caseId}/parties
POST   /cases/{caseId}/parties
GET    /cases/{caseId}/parties/{partyId}
PUT    /cases/{caseId}/parties/{partyId}
PATCH  /cases/{caseId}/parties/{partyId}/deactivate
PATCH  /cases/{caseId}/parties/{partyId}/reactivate
GET    /cases/{caseId}/parties/{partyId}/services
GET    /cases/{caseId}/parties/{partyId}/timeline
```

API kuralları:

- Tüm istekler kimlik doğrulaması gerektirir.
- Dosya ve mahkeme yetkisi kontrol edilir.
- Tenant izolasyonu uygulanır.
- Hata yanıtları standart hata formatında döndürülür.
- Oluşturma ve güncelleme işlemleri Audit Log üretir.

---

## 7.18 Örnek İstek

```json
{
  "partyType": "PERSON",
  "role": "DEFENDANT",
  "firstName": "Mehmet",
  "lastName": "Yılmaz",
  "nationalId": null,
  "phone": null,
  "email": null,
  "address": "Ankara",
  "notes": ""
}
```

## 7.19 Örnek Yanıt

```json
{
  "id": "0bd99f79-5e5a-4f83-a431-01f9a92a8bf7",
  "caseFileId": "da0fbd5b-b6a1-42f6-8e9b-2d43f5af22f1",
  "partyType": "PERSON",
  "role": "DEFENDANT",
  "displayName": "Mehmet Yılmaz",
  "isActive": true,
  "latestServiceStatus": null,
  "createdAt": "2026-07-19T19:00:00+03:00"
}
```

---

## 7.20 Hata Kodları

| Kod | Açıklama |
|---|---|
| PARTY_NOT_FOUND | Taraf bulunamadı |
| PARTY_ACCESS_DENIED | Kullanıcının taraf veya dosya erişimi yok |
| PARTY_DUPLICATE_WARNING | Olası mükerrer kayıt bulundu |
| PARTY_HAS_ACTIVE_PROCESS | Aktif süreç nedeniyle işlem yapılamaz |
| PARTY_ROLE_CHANGE_BLOCKED | Rol değişikliği engellendi |
| PARTY_DEACTIVATION_REASON_REQUIRED | Pasife alma gerekçesi zorunlu |
| INVALID_PARTY_TYPE | Taraf türü geçersiz |
| INVALID_PARTY_ROLE | Taraf rolü geçersiz |

---

## 7.21 Audit Log Gereksinimleri

Aşağıdaki işlemler kaydedilmelidir:

- Taraf oluşturma
- Taraf bilgisi güncelleme
- Rol değişikliği girişimi
- Tarafı pasife alma
- Tarafı yeniden aktifleştirme
- Kimlik veya vergi numarası değişikliği
- Mükerrer uyarısına rağmen kayıt oluşturma

Log kaydı en az şu alanları içermelidir:

- İşlemi yapan kullanıcı
- Tarih ve saat
- Adliye
- Mahkeme
- Dosya
- Taraf
- İşlem türü
- Eski değer
- Yeni değer
- Gerekçe
- IP adresi

---

## 7.22 Test Senaryoları

### TS-07-001 — Tek davacı ekleme

**Adımlar:** Yetkili kullanıcı dosyaya geçerli bir gerçek kişi davacı ekler.

**Beklenen:** Kayıt oluşur, taraf listesinde görünür ve Audit Log yazılır.

### TS-07-002 — Birden fazla davalı ekleme

**Adımlar:** Aynı dosyaya sekiz farklı davalı eklenir.

**Beklenen:** Tüm kayıtlar bağımsız olarak saklanır ve sistem taraf sayısında sınırlama uygulamaz.

### TS-07-003 — Eksik gerçek kişi bilgisi

**Adımlar:** Soyadı olmadan gerçek kişi kaydı oluşturulur.

**Beklenen:** `PV-003` doğrulama hatası döner.

### TS-07-004 — Olası mükerrer taraf

**Adımlar:** Aynı dosyaya aynı ad ve soyadla ikinci taraf eklenir.

**Beklenen:** Sistem uyarı gösterir; kullanıcı gerekçeli olarak devam edebilir.

### TS-07-005 — Geçmiş tebligatı olan tarafı silme

**Adımlar:** Tebligat geçmişi olan taraf fiziksel olarak silinmeye çalışılır.

**Beklenen:** İşlem reddedilir; yalnızca pasife alma seçeneği sunulur.

### TS-07-006 — Yetkisiz mahkeme tarafına erişim

**Adımlar:** Kullanıcı yetkili olmadığı mahkemenin taraf kaydını API üzerinden çağırır.

**Beklenen:** HTTP 403 ve `PARTY_ACCESS_DENIED` hatası döner.

### TS-07-007 — Aktif istinaf sürecinde rol değişikliği

**Adımlar:** Aktif kanun yolu sürecindeki davalının rolü davacı olarak değiştirilir.

**Beklenen:** İşlem `PARTY_ROLE_CHANGE_BLOCKED` hatasıyla reddedilir.

### TS-07-008 — Pasif tarafın yeni tebligata dahil edilmesi

**Adımlar:** Pasif taraf için yeni tebligat oluşturulmaya çalışılır.

**Beklenen:** İşlem varsayılan olarak engellenir ve kullanıcıya tarafın pasif olduğu bildirilir.

---

## 7.23 Edge Case Kataloğu

- Aynı isimde iki farklı gerçek kişi
- Aynı kurumun farklı şubeleri
- Taraf adının karar sonrasında düzeltilmesi
- Yanlış rol ile eklenmiş taraf
- Sonradan dosyaya eklenen taraf
- Tarafın süreç devam ederken pasife alınması
- Bir tarafın birden fazla başvuru yapması
- Birden fazla başvuranın aynı karşı tarafa tebligat gerektirmesi
- Kimlik numarası bulunmayan yabancı taraf
- Kurum unvanının çok uzun olması
- Tarafın adresinin bilinmemesi
- Taraf kaydına bağlı mükerrer tebligat
- Arşivlenmiş dosyadaki tarafın görüntülenmesi
- Dosya yeniden açıldığında pasif ve aktif tarafların durumu

---

## 7.24 Performans ve Güvenlik

- Taraf listeleri sayfalama desteklemelidir.
- `case_file_id`, `courthouse_id`, `role`, `is_active` alanlarında uygun indeksler bulunmalıdır.
- Hassas kimlik verileri loglarda açık metin olarak tutulmamalıdır.
- API yanıtlarında T.C. Kimlik No ve vergi numarası varsayılan olarak maskelenmelidir.
- Arama sonuçları yalnızca kullanıcının yetkili olduğu mahkemelerle sınırlı olmalıdır.
- Taraf adlarında büyük/küçük harf ve Türkçe karakter normalizasyonu mükerrer kontrolünde dikkate alınmalıdır.

---

## 7.25 Kodlama Ajanı İçin Uygulama Talimatları

1. Taraf modülünü dosya modülünden bağımsız fakat `case_file_id` ile bağlı bir domain modülü olarak geliştir.
2. Taraf türü ve rolü için enum kullan.
3. Tenant izolasyonunu repository ve servis katmanında uygula.
4. Fiziksel silme endpoint'i oluşturma.
5. İş kurallarını UI içine yerleştirme.
6. Mükerrer kontrolünü kesin hata değil, uyarı mekanizması olarak uygula.
7. Tüm oluşturma, güncelleme ve pasife alma işlemlerini transaction içinde yürüt.
8. Taraf değişikliklerinden sonra dosya durumunu ve açık görevleri yeniden hesaplat.
9. Hassas alanları maskele ve audit log'a açık biçimde yazma.
10. Bu bölümdeki her validasyon ve test senaryosu için birim ve entegrasyon testleri oluştur.

---

## 7.26 Kabul Kriterleri

Taraf Yönetimi Modülü aşağıdaki koşullar sağlandığında tamamlanmış kabul edilir:

- Yetkili kullanıcı dosyaya sınırsız sayıda davacı ve davalı ekleyebilir.
- Gerçek kişi ve tüzel kişi alanları doğru şekilde ayrıştırılır.
- Mükerrer kayıt uyarısı çalışır.
- Taraf fiziksel olarak silinemez.
- Taraf pasife alınabilir ve geçmiş bağlantılar korunur.
- Tebligat, kanun yolu ve harç modülleri taraf kaydıyla ilişki kurabilir.
- Yetkisiz kullanıcı başka mahkemenin taraf verisine erişemez.
- Audit Log eksiksiz oluşur.
- Validasyon ve test senaryoları başarıyla geçer.


# Bölüm 05 — Yetkilendirme ve Rol Yönetimi

## 5.1 Amaç

Bu bölüm kullanıcı kimlik doğrulama, rol yönetimi ve yetkilendirme kurallarını tanımlar.

---

# 5.2 Temel İlke

Yetkilendirme DOSYA bazlı değildir.

Yetkilendirme yalnızca MAHKEME bazlıdır.

Bir kullanıcı bir veya daha fazla mahkemeye atanabilir.

---

# 5.3 Roller

## Super Admin

Yetkiler

- Adliye oluşturabilir
- Adliye güncelleyebilir
- Adliye silebilir
- Adliye yöneticisi atayabilir
- Sistem loglarını görebilir
- Tüm sistemi yedekleyebilir

Kısıtlar

- Dosya üzerinde işlem yapamaz.

---

## Adliye Admini

Yetkiler

- Mahkeme oluşturabilir
- Mahkeme düzenleyebilir
- Müdür oluşturabilir
- Müdüre mahkeme atayabilir
- Kendi adliyesini yedekleyebilir

Kısıtlar

- Başka adliyeleri göremez.

---

## Yazı İşleri Müdürü

Yetkiler

- Yetkili olduğu mahkemeleri görebilir.
- Dosya oluşturabilir.
- Dosya güncelleyebilir.
- Tebligat ekleyebilir.
- Başvuru ekleyebilir.
- Manuel kesinleşme yapabilir.
- Manuel üst mahkemeye gönderme işlemi yapabilir.

Kısıtlar

- Yetkili olmadığı mahkemeleri göremez.
- Sistem ayarlarını değiştiremez.

---

# 5.4 Kimlik Doğrulama

- E-posta + parola
- Parolalar hash olarak saklanacaktır.
- Oturum zaman aşımı uygulanacaktır.
- Güvenli token tabanlı oturum yönetimi kullanılacaktır.

---

# 5.5 Yetki Kontrolleri

Her API isteğinde aşağıdaki kontroller yapılacaktır.

1. Kullanıcı doğrulandı mı?
2. Rol uygun mu?
3. Mahkeme yetkisi var mı?
4. İşlem yapma yetkisi var mı?

Başarısız istekler reddedilecektir.

---

# 5.6 Mahkeme Atama Süreci

1. Admin kullanıcı oluşturur.
2. Kullanıcıya rol atanır.
3. Kullanıcı bir veya daha fazla mahkemeye atanır.
4. Atama anında aktif olur.

Yetki kaldırıldığında erişim hemen sonlandırılır.

---

# 5.7 Güvenlik Kuralları

- Kullanıcı kendi rolünü değiştiremez.
- Kullanıcı başka kullanıcının yetkisini değiştiremez.
- Kritik işlemler ikinci kez doğrulanabilir.
- Başarısız giriş denemeleri kayıt altına alınır.

---

# 5.8 Audit Log

Aşağıdaki işlemler loglanacaktır.

- Giriş
- Çıkış
- Yetki verme
- Yetki kaldırma
- Rol değişikliği
- Parola değiştirme

---

# 5.9 Yetki Matrisi

| İşlem | Super Admin | Adliye Admini | Müdür |
|-------|-------------|---------------|-------|
| Adliye Yönetimi | ✓ | ✗ | ✗ |
| Mahkeme Yönetimi | ✓ | ✓ | ✗ |
| Kullanıcı Oluşturma | ✓ | ✓ | ✗ |
| Mahkeme Atama | ✓ | ✓ | ✗ |
| Dosya Yönetimi | ✗ | ✗ | ✓ |
| Tebligat Yönetimi | ✗ | ✗ | ✓ |
| Kesinleşme | ✗ | ✗ | ✓ |
| İstinaf Gönderme | ✗ | ✗ | ✓ |
| Sistem Logları | ✓ | Kendi Adliyesi | ✗ |

---

# 5.10 Test Senaryoları

TS-01
Yetkisiz kullanıcı farklı mahkemeye erişmeye çalışır.
Beklenen: HTTP 403.

TS-02
Mahkeme ataması kaldırılır.
Beklenen: Erişim anında kesilir.

TS-03
Adliye Admini başka adliyeyi görüntülemeye çalışır.
Beklenen: Erişim reddedilir.

TS-04
Müdür sistem ayarlarına erişmeye çalışır.
Beklenen: Erişim reddedilir.

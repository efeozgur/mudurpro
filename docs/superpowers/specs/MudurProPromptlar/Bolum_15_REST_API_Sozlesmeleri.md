# Bölüm 15 — REST API Sözleşmeleri

## 15.1 Amaç

Bu doküman istemci (Frontend), Backend ve kodlama ajanları arasında ortak API sözleşmesini tanımlar.

Temel kurallar:

- REST mimarisi kullanılacaktır.
- JSON veri formatı kullanılacaktır.
- UTF-8 kullanılacaktır.
- Tüm endpoint'ler HTTPS üzerinden çalışacaktır.

---

# 15.2 Kimlik Doğrulama

Authorization: Bearer <JWT>

Yetkisiz istek:

HTTP 401 Unauthorized

Yetkisi olmayan kullanıcı:

HTTP 403 Forbidden

---

# 15.3 Standart Başarılı Yanıt

```json
{
  "success": true,
  "data": {},
  "message": null
}
```

---

# 15.4 Standart Hata Yanıtı

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Esas No zorunludur."
  }
}
```

---

# 15.5 Kimlik Doğrulama API

POST /api/v1/auth/login

POST /api/v1/auth/logout

POST /api/v1/auth/refresh

GET /api/v1/auth/me

---

# 15.6 Dosya API

GET /api/v1/cases

GET /api/v1/cases/{id}

POST /api/v1/cases

PUT /api/v1/cases/{id}

PATCH /api/v1/cases/{id}/archive

PATCH /api/v1/cases/{id}/restore

DELETE işlemi desteklenmez.

---

# 15.7 Taraf API

GET /api/v1/cases/{id}/parties

POST /api/v1/cases/{id}/parties

PUT /api/v1/parties/{id}

PATCH /api/v1/parties/{id}/deactivate

---

# 15.8 Tebligat API

GET /api/v1/services

POST /api/v1/services

PUT /api/v1/services/{id}

PATCH /api/v1/services/{id}/status

---

# 15.9 Kanun Yolu API

GET /api/v1/appeals

POST /api/v1/appeals

PUT /api/v1/appeals/{id}

---

# 15.10 Harç API

GET /api/v1/fees

POST /api/v1/fees

PATCH /api/v1/fees/{id}/payment

---

# 15.11 Dashboard API

GET /api/v1/dashboard

GET /api/v1/dashboard/widgets

---

# 15.12 Bildirim API

GET /api/v1/notifications

PATCH /api/v1/notifications/{id}/read

PATCH /api/v1/notifications/{id}/complete

---

# 15.13 Audit API

GET /api/v1/audit

GET /api/v1/cases/{id}/timeline

---

# 15.14 HTTP Durum Kodları

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# 15.15 Sayfalama

GET /cases?page=1&pageSize=20

Yanıt:

```json
{
  "page":1,
  "pageSize":20,
  "total":356,
  "items":[]
}
```

---

# 15.16 Filtreleme

Örnek

GET /cases?courtId=12&status=ACTIVE

GET /cases?esasNo=2025/123

GET /cases?decisionNo=2025/88

---

# 15.17 Sıralama

sort=decisionDate

order=asc

order=desc

---

# 15.18 API Güvenliği

- HTTPS zorunlu.
- JWT doğrulaması zorunlu.
- Rol kontrolü her istekte yapılmalıdır.
- Mahkeme bazlı yetki kontrolü uygulanmalıdır.

---

# 15.19 Test Senaryoları

TS-01
JWT olmadan istek.
Beklenen:
401

TS-02
Yetkisiz mahkemeye erişim.
Beklenen:
403

TS-03
Geçersiz veri.
Beklenen:
422

TS-04
Başarılı kayıt.
Beklenen:
201

---

# 15.20 Kodlama Ajanı Notları

- API sürümlendirmesi (/api/v1) zorunludur.
- OpenAPI (Swagger) dokümantasyonu üretilmelidir.
- Tüm endpoint'ler merkezi exception handler kullanmalıdır.
- İstek ve yanıt DTO'ları Entity nesnelerinden ayrılmalıdır.

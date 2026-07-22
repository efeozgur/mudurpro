# MüdürPro — Dava Dosya Yönetim Sistemi

Adliye bünyesindeki dava dosyalarının takibi, tebligat süreçleri, kanun yolu başvuruları ve harç yönetimi için kurumsal web uygulaması.

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Backend | NestJS, TypeORM, PostgreSQL |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Grafikler | Recharts |
| Auth | JWT (access + refresh token) |
| Container | Docker, docker-compose |
| Veritabanı | PostgreSQL 16, pgAdmin |

## Özellikler

- **Dashboard** — kritik süreler, bekleyen tebligatlar, harç özeti, servis takibi grafikleri
- **Dosya Yönetimi** — esas/karar no, taraf ekleme, durum geçişleri (ACTIVE → FINALIZED → ARCHIVED)
- **Tebligat Takibi** — hazırlama, gönderme, tebliğ/iade kaydı, süre hesaplama
- **Kanun Yolu** — istinaf/temyiz başvuruları, cevap süresi takibi, üst mahkemeye gönderme
- **Harç Takibi** — tahsilat, müzekkere gerekenler, gecikmiş ödemeler
- **Çoklu Mahkeme** — kullanıcı bazında mahkeme yetkilendirme, tenant yapısı
- **Rol Tabanlı Erişim** — SUPER_ADMIN, ADLIYE_ADMIN, MUDUR
- **Denetim Günlüğü** — tüm CRUD işlemleri kayıt altına alınır

## Geliştirme

### Gereksinimler

- Node.js ≥ 20
- PostgreSQL 16
- npm

### Kurulum

```bash
# Backend
cd backend
npm install
cp .env.example .env   # PostgreSQL bağlantı bilgilerini güncelle
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker compose -f docker/docker-compose.yml up -d
```

### Test

```bash
cd backend
npx jest
```

## Proje Yapısı

```
backend/
├── src/
│   ├── common/           # Guards, decorators, interceptors
│   ├── database/         # Migration, seed
│   └── modules/
│       ├── auth/         # Kullanıcı yönetimi, JWT
│       ├── case-file/    # Dava dosyası CRUD
│       ├── court/        # Mahkeme tanımları
│       ├── dashboard/    # Dashboard widget'ları
│       ├── fee-tracking/ # Harç takibi
│       ├── party/        # Taraf yönetimi
│       ├── service-record/ # Tebligat kayıtları
│       └── sure-engine/  # Süre hesaplama motoru
└── docker/

frontend/
├── src/
│   ├── components/
│   │   ├── shared/       # StatusBadge, DataTable, LoadingSpinner
│   │   ├── dashboard/    # StatsCard, CriticalTable
│   │   ├── appeal/       # Başvuru listesi, cevap bildirimi
│   │   ├── fee/          # Harç listesi
│   │   ├── party/        # Taraf formu/listesi
│   │   └── ui/           # shadcn/ui bileşenleri
│   └── pages/            # case-detail, dashboard, cases, login
└── docker/
```

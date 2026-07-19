# MudurPro Premium UI Redesign — Tasarım Dokümanı

**Tarih:** 2026-07-19  
**Stil:** Premium Kurumsal (Hibrit: Lacivert + Altın Sarısı)  
**Durum:** Onaylandı

---

## 1. Genel Bakış

Mevcut MudurPro arayüzü temel bir admin paneli yapısında. Bu redesign ile hedef: **kurumsal güveni modern sadelikle birleştiren**, hukuk bürosu/banka ciddiyetinde, profesyonel bir arayüz.

**Tasarım yönü:** Premium Kurumsal — lacivert + altın sarısı palet, serif başlık vurguları, koyu sidebar + açık içerik alanı.

---

## 2. Tasarım Sistemi (Design Tokens)

### 2.1 Renk Paleti

| Token | Hex | Kullanım |
|-------|-----|----------|
| `--background` | `#f1f5f9` | Sayfa arka planı |
| `--foreground` | `#0f172a` | Ana metin rengi |
| `--card` | `#ffffff` | Kart arka planı |
| `--card-foreground` | `#0f172a` | Kart metni |
| `--primary` | `#c9a84c` | Altın — birincil vurgu (buton, aktif menü, tab) |
| `--primary-foreground` | `#1a1a1a` | Primary üzeri metin |
| `--secondary` | `#1e293b` | Lacivert — sidebar, koyu alanlar |
| `--secondary-foreground` | `#f8fafc` | Koyu alan üzeri metin |
| `--muted` | `#f8fafc` | Soluk arka plan |
| `--muted-foreground` | `#64748b` | İkincil metin |
| `--accent` | `rgba(201,168,76,0.12)` | Hover/aktif arka plan (altın %12) |
| `--accent-foreground` | `#c9a84c` | Hover/aktif metin |
| `--destructive` | `#dc2626` | Hata/silme/tehlike |
| `--destructive-foreground` | `#ffffff` | Destructive üzeri metin |
| `--border` | `#e2e8f0` | Genel border |
| `--input` | `#d1d5db` | Input border |
| `--ring` | `#c9a84c` | Focus ring |
| `--success` | `#16a34a` | Başarı/aktif |
| `--warning` | `#d97706` | Uyarı/beklemede |
| `--info` | `#2563eb` | Bilgi |

### 2.2 Sidebar Renkleri

| Token | Hex | Kullanım |
|-------|-----|----------|
| `--sidebar-bg` | `#0f1a2e` | Sidebar arka plan |
| `--sidebar-border` | `#1e3148` | Sidebar iç border |
| `--sidebar-text` | `#94a3b8` | Sidebar menü metni |
| `--sidebar-active-bg` | `rgba(201,168,76,0.12)` | Aktif menü arka planı |
| `--sidebar-active-text` | `#c9a84c` | Aktif menü metni |
| `--sidebar-user-bg` | `#1e3148` | Kullanıcı avatar arka planı |

### 2.3 Tipografi

| Kullanım | Font | Weight | Boyut |
|----------|------|--------|-------|
| Logo | Georgia, serif | 700 | 22px |
| Sayfa başlığı | Georgia, serif | 700 | 18px |
| Tablo başlığı | system-ui, sans-serif | 500 | 12px |
| Gövde metni | system-ui, sans-serif | 400 | 13px |
| Küçük metin | system-ui, sans-serif | 400 | 10-11px |
| Etiket (label) | system-ui, sans-serif | 500 | 10px |
| Tablo header | system-ui, sans-serif | 600 | 9px (uppercase) |

**Not:** `Poppins` / `Open Sans` eklenebilir, ancak sistem fontlarıyla başlanacak. Google Fonts sonradan entegre edilebilir.

### 2.4 Spacing Scale (8px tabanlı)

| Token | Değer |
|-------|-------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |

### 2.5 Gölgeler

| Seviye | Değer | Kullanım |
|--------|-------|----------|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.06)` | Kartlar |
| `shadow-dropdown` | `0 4px 12px rgba(0,0,0,0.1)` | Dropdown/popover |
| `shadow-modal` | `0 20px 60px rgba(0,0,0,0.3)` | Modal/dialog |

### 2.6 Border Radius

| Token | Değer | Kullanım |
|-------|-------|----------|
| `radius-sm` | 3px | Badge, küçük etiket |
| `radius-md` | 4px | Input, buton, tab |
| `radius-lg` | 6px | Kart, tablo |
| `radius-xl` | 8px | Modal, büyük kart |

### 2.7 Motion

- Micro-interaction: 150-200ms ease-out
- Sayfa geçişi: yok (SPA içi anlık)
- Hover: opacity/background transition 150ms
- `prefers-reduced-motion` saygı göster

---

## 3. Layout Mimarisi

### 3.1 Genel Yapı

```
┌──────────┬──────────────────────────────────────┐
│          │  Header (beyaz, border-bottom)       │
│          ├──────────────────────────────────────┤
│ Sidebar  │                                      │
│ (200px)  │  Content Area                        │
│ Lacivert │  (arka plan #f1f5f9)                 │
│ #0f1a2e  │  padding: 16px 20px                  │
│          │                                      │
│          │  Kartlar / Tablolar (beyaz, shadow)  │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

### 3.2 Sidebar

- Genişlik: 200px (şu anki 240px'ten daraltıldı)
- Arka plan: `#0f1a2e`
- Logo: Georgia serif, 14px, `#f1f5f9` + altın ikon
- Menü öğeleri: 10-11px, `#94a3b8`, 7px padding, 4px border-radius
- Aktif öğe: `rgba(201,168,76,0.12)` arka plan, `#c9a84c` metin
- Alt bilgi: Kullanıcı avatar + ad + email

### 3.3 Header

- Yükseklik: auto (padding 14-16px)
- Arka plan: `#ffffff`
- Alt border: `1px solid #e2e8f0`
- Solda: Serif sayfa başlığı + alt başlık
- Sağda: Aksiyon butonları + bildirim ikonu

### 3.4 Content Area

- Arka plan: `#f1f5f9`
- Padding: `16px 20px`
- Kartlar: Beyaz, 6px border-radius, hafif gölge

---

## 4. Bileşen Tasarımı

### 4.1 Butonlar

**Primary (Altın):**
- Arka plan: `linear-gradient(135deg, #c9a84c, #b8941f)`
- Metin: `#1a1a1a`, 600 weight
- Padding: 8px 16px
- Border-radius: 4px

**Secondary (Outline):**
- Border: `1px solid #c9a84c`
- Metin: `#c9a84c`
- Arka plan: transparent

**Danger (Silme):**
- Arka plan: `#dc2626`
- Metin: `#ffffff`

### 4.2 Stat Kartları

- Beyaz arka plan, 6px border-radius
- Sol kenar: 3px renkli border (kırmızı=kritik, amber=bekleyen, yeşil=hazır, mavi=harç)
- İçerik: küçük etiket (10px uppercase), büyük sayı (22px bold)
- Padding: 14px

### 4.3 Veri Tabloları

- Beyaz arka plan, 6px border-radius, gölge
- Header: `#f8fafc` arka plan, 9px uppercase, `#64748b`
- Satır: 9-10px padding, `#0f172a` metin
- Hover satır: `#fffbeb` (açık amber)
- Pagination: sayfa numaraları, aktif lacivert

### 4.4 Status Badge'leri

- Küçük pill: 2-4px padding, 3px border-radius, 9-10px font
- Kritik: `#fee2e2` arka plan, `#991b1b` metin
- Takipte: `#fef3c7` arka plan, `#92400e` metin
- Normal: `#dbeafe` arka plan, `#1e40af` metin
- Tamamlandı: `#f0fdf4` arka plan, `#166534` metin

### 4.5 Tablar (Sekmeler)

- Alt çizgi tab tasarımı
- Aktif tab: `2px solid #c9a84c` alt border, `#c9a84c` metin
- Pasif tab: `#64748b` metin
- Container: beyaz arka plan, `1px solid #e2e8f0` alt border

### 4.6 Input / Form Elemanları

- Border: `1px solid #d1d5db`, 4px radius
- Padding: 10px 12px
- Focus: `#c9a84c` ring
- Label: 10px, `#475569`, 500 weight

### 4.7 Dialog / Modal

- Beyaz arka plan, 8px radius
- Başlık: Georgia serif, 16px
- Overlay: `rgba(0,0,0,0.5)`

### 4.8 Bildirim (Notification) Rozeti

- Kırmızı daire: `#ef4444`, 9px font, 5px padding, 8px radius

---

## 5. Sayfa Tasarımları

### 5.1 Login (`/login`)

- Tam ekran koyu degrade arka plan (`#0f1a2e` → `#1a2f4a` → `#0f1a2e`)
- İnce geometrik desen overlay (opsiyonel)
- Ortalanmış beyaz kart (380px genişlik)
- Logo: Altın ikon + Georgia "MudurPro"
- Form: E-posta + Şifre + Giriş Yap butonu

### 5.2 Dashboard (`/dashboard`)

- Header: "Dashboard" başlık + "Yeni Dosya" butonu
- 4'lü stat kartı grid (responsive: 1/2/4 kolon)
- Öneri kutusu: gradient arka plan (`#eff6ff` → `#fef3c7`), ikon + metin
- 2 kolon: Kritik Süreler tablosu + Son İşlemler listesi

### 5.3 Dosya Listesi (`/cases`)

- Header: "Dosyalar" serif başlık + "Yeni Dosya" altın buton
- Arama input'u (250px, esas no ile)
- Tablo: Esas No, Mahkeme, Durum (badge), Kalan Süre
- Kritik satırlar: `#fffbeb` arka plan vurgusu
- Alt: Sayfalama (lacivert aktif sayfa)

### 5.4 Dosya Detay (`/cases/:id`)

- Header: "← Dosyalar" + Esas No (serif) + Durum badge'i
- Alt bilgi satırı: Mahkeme, Karar No, Kalan süre
- Tab bar: Taraflar, Tebligatlar, İtirazlar, Harçlar
- Dosya bilgi kartı: 4 alan grid (Esas No, Karar No, Tarih, Durum)
- Taraflar tablosu: Rol badge, Ad Soyad, Tebligat durumu
- "+ Taraf Ekle" butonu: outline altın

### 5.5 Kullanıcı Yönetimi (`/users`)

- Header: "Kullanıcılar" serif başlık + "Kullanıcı Ekle" butonu
- Tablo: Avatar + Ad Soyad, E-posta, Rol (renkli badge), Durum (yeşil/gri nokta)
- Rol badge'leri: Müdür (altın), Adliye Admin (mavi), Süper Admin (yeşil)

### 5.6 Adliye / Mahkeme Yönetimi

Mevcut tablo sayfaları aynı tasarım diliyle güncellenecek (header, tablo, buton stilleri).

---

## 6. Tailwind CSS Entegrasyonu

### 6.1 Yaklaşım

Tailwind v4 + CSS custom properties (`@theme`) kullanılacak. Özel sidebar renkleri için Tailwind yapılandırması genişletilecek.

Proje zaten `@tailwindcss/vite` plugin ile Tailwind v4 kullanıyor. `index.css` içinde `@theme` bloğu ile özel token'lar tanımlanacak.

### 6.2 Eklenecek CSS Değişkenleri

```css
@import "tailwindcss";

@theme {
  --color-sidebar: #0f1a2e;
  --color-sidebar-border: #1e3148;
  --color-sidebar-text: #94a3b8;
  --color-sidebar-active: #c9a84c;
  --color-gold: #c9a84c;
  --color-gold-dark: #b8941f;
  --color-gold-light: rgba(201, 168, 76, 0.12);
}
```

---

## 7. Uygulama Planı

### 7.1 Sıralama

1. **CSS/Tema altyapısı** — `index.css` ve Tailwind token'ları
2. **Layout bileşenleri** — Sidebar, Header (en kritik, tüm sayfaları etkiler)
3. **UI primitifleri** — Button, Input, Badge, Card, Table (hepsi güncellenecek)
4. **Shared bileşenler** — DataTable, StatusBadge, EmptyState, ConfirmDialog
5. **Sayfa sırasıyla:**
   - Login
   - Dashboard
   - Dosya Listesi (Cases)
   - Dosya Detay (CaseDetail)
   - Bildirim Merkezi
   - Denetim Kayıtları
   - Kullanıcı Yönetimi
   - Adliye Yönetimi
   - Mahkeme Yönetimi

### 7.2 Değişmeyecekler

- Backend API (hiçbir değişiklik yok)
- İş mantığı (form validation, state management, route yapısı)
- Dosya organizasyonu (mevcut klasör yapısı korunacak)

### 7.3 Dikkat Edilecekler

- Sidebar genişliği 240px → 200px (tüm `ml-60` / `w-60` referansları güncellenecek)
- Base UI bileşenleri (`@base-ui/react`) değişmeyecek, sadece stilleri güncellenecek
- `react-hook-form` + `zod` form yapısı aynen kalacak
- Responsive davranış korunacak (`sm:`, `lg:` breakpoint'leri)

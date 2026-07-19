# MudurPro Premium UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform MudurPro from a basic admin panel into a premium corporate UI with navy + gold color scheme, professional typography, and refined component styling.

**Architecture:** Update CSS tokens first, then layout components (sidebar/header), then UI primitives, then shared components, then pages. Backend is unchanged. All components keep their current logic; only styles and markup are updated.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Base UI (`@base-ui/react`), Lucide React, React Router DOM, TanStack React Query

## Global Constraints

- Sidebar width: 200px (was 240px) — all `w-60`/`ml-60` references become `w-50`/`ml-50`
- Primary color: `--color-gold: #c9a84c`; Secondary: `--color-navy: #0f1a2e`
- Page title font: `font-[family-name:Georgia,serif]` for main headings
- Backend API: no changes
- Base UI primitives: keep using `@base-ui/react`, only update Tailwind classes
- `react-hook-form` + `zod` forms: unchanged
- All Turkish labels preserved

---

### Task 1: CSS Theme Tokens

**Files:**
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: CSS custom properties for `--color-gold`, `--color-gold-dark`, `--color-navy`, `--color-sidebar`, `--color-sidebar-border`, `--color-sidebar-text`, `--color-sidebar-active`, background `#f1f5f9`, foreground `#0f172a`, card `#ffffff`

- [ ] **Step 1: Update index.css with design tokens**

```css
@import "tailwindcss";

@theme {
  --color-gold: #c9a84c;
  --color-gold-dark: #b8941f;
  --color-navy: #0f1a2e;
  --color-navy-light: #1e3148;
  --color-sidebar: #0f1a2e;
  --color-sidebar-border: #1e3148;
  --color-sidebar-text: #94a3b8;
  --color-sidebar-active: #c9a84c;
  --color-sidebar-hover: #1e293b;

  --color-background: #f1f5f9;
  --color-foreground: #0f172a;
  --color-card: #ffffff;
  --color-card-foreground: #0f172a;
  --color-primary: #c9a84c;
  --color-primary-foreground: #1a1a1a;
  --color-secondary: #1e293b;
  --color-secondary-foreground: #f8fafc;
  --color-muted: #f8fafc;
  --color-muted-foreground: #64748b;
  --color-accent: rgba(201, 168, 76, 0.12);
  --color-accent-foreground: #c9a84c;
  --color-destructive: #dc2626;
  --color-destructive-foreground: #ffffff;
  --color-border: #e2e8f0;
  --color-input: #d1d5db;
  --color-ring: #c9a84c;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-info: #2563eb;

  --color-critical-bg: #fee2e2;
  --color-critical-text: #991b1b;
  --color-warning-bg: #fef3c7;
  --color-warning-text: #92400e;
  --color-normal-bg: #dbeafe;
  --color-normal-text: #1e40af;
  --color-success-bg: #f0fdf4;
  --color-success-text: #166534;

  --radius-sm: 3px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add premium corporate design tokens (navy + gold theme)"
```

---

### Task 2: Sidebar Redesign

**Files:**
- Modify: `frontend/src/components/layout/sidebar.tsx`

**Interfaces:**
- Consumes: CSS tokens from Task 1
- Produces: Sidebar component with navy background, gold active state, 200px width, Georgia logo

- [ ] **Step 1: Replace sidebar.tsx with premium design**

```tsx
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  FolderOpen,
  Building2,
  Users,
  Bell,
  FileSearch,
  Scale,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['MUDUR'] },
  { label: 'Dosyalar', path: '/cases', icon: <FolderOpen className="h-4 w-4" />, roles: ['MUDUR'] },
  { label: 'Bildirimler', path: '/notifications', icon: <Bell className="h-4 w-4" />, roles: ['MUDUR', 'ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Denetim Kayıtları', path: '/audit', icon: <FileSearch className="h-4 w-4" />, roles: ['MUDUR', 'ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Adliyeler', path: '/courthouses', icon: <Building2 className="h-4 w-4" />, roles: ['SUPER_ADMIN'] },
  { label: 'Mahkemeler', path: '/courts', icon: <Scale className="h-4 w-4" />, roles: ['ADLIYE_ADMIN', 'SUPER_ADMIN'] },
  { label: 'Kullanıcılar', path: '/users', icon: <Users className="h-4 w-4" />, roles: ['ADLIYE_ADMIN', 'SUPER_ADMIN'] },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || '';

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-50 flex-col bg-navy">
      <div className="flex items-center gap-2 border-b border-navy-light px-4 py-4">
        <span className="text-lg text-gold">&#9878;</span>
        <div>
          <span className="text-sm font-bold text-white font-[family-name:Georgia,serif]">MudurPro</span>
          <p className="text-[10px] text-sidebar-text">Yazı İşleri Müdürü</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {filtered.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2.5 rounded-[4px] px-3 py-[7px] text-[11px] font-medium transition-colors',
                isActive
                  ? 'bg-gold/12 text-gold'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-gray-200'
              )}
            >
              {item.icon}
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-navy-light px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-light text-[10px] font-semibold text-gold">
            {user?.name ? getInitials(user.name) : '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] text-gray-200">{user?.name}</p>
            <p className="truncate text-[9px] text-sidebar-text">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/sidebar.tsx
git commit -m "feat: redesign sidebar with navy bg, gold accents, 200px width"
```

---

### Task 3: Header Redesign

**Files:**
- Modify: `frontend/src/components/layout/header.tsx`

**Interfaces:**
- Consumes: CSS tokens from Task 1, sidebar width change
- Produces: Header with page title, gold "Yeni Dosya" button, notification bell, user dropdown

- [ ] **Step 1: Replace header.tsx with premium design**

```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Plus, LogOut, User } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/unread');
      return res.data.data;
    },
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const unreadCount = Array.isArray(unread) ? unread.length : unread?.count ?? 0;

  const roleLabel =
    user?.role === 'MUDUR' ? 'Müdür Paneli' : user?.role === 'ADLIYE_ADMIN' ? 'Adliye Yönetimi' : 'Sistem Yönetimi';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-5 py-3.5">
      <h2 className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">{roleLabel}</h2>

      <div className="flex items-center gap-2">
        {user?.role === 'MUDUR' && (
          <button
            onClick={() => navigate('/cases?new=true')}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-gradient-to-br from-gold to-gold-dark px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Yeni Dosya</span>
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/notifications')}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-2 hover:bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/header.tsx
git commit -m "feat: redesign header with gold gradient button, clean layout"
```

---

### Task 4: AppLayout Width Update

**Files:**
- Modify: `frontend/src/components/layout/app-layout.tsx`

**Interfaces:**
- Consumes: Sidebar width change (200px)
- Produces: Updated layout with `ml-50` and `p-5` content padding

- [ ] **Step 1: Update ml-60 to ml-50 and p-6 to p-5**

```tsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-50 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/layout/app-layout.tsx
git commit -m "feat: update layout for 200px sidebar, lighter bg"
```

---

### Task 5: Button Component Update

**Files:**
- Modify: `frontend/src/components/ui/button.tsx`

**Interfaces:**
- Consumes: CSS tokens from Task 1
- Produces: Buttons with 4px radius, gold default variant, refined destructive

- [ ] **Step 1: Update button variants for premium look**

Replace `buttonVariants` in `button.tsx`:

```tsx
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[4px] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-gold to-gold-dark text-primary-foreground hover:opacity-90",
        outline:
          "border-border bg-card hover:bg-muted hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs: "h-6 gap-1 rounded-[3px] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[3px] px-2.5 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-4",
        icon: "size-8",
        "icon-xs": "size-6 rounded-[3px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[3px]",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ui/button.tsx
git commit -m "feat: premium button styles with gold gradient, 4px radius"
```

---

### Task 6: Badge, Card, Table, Input, Dialog Style Updates

**Files:**
- Modify: `frontend/src/components/ui/badge.tsx`
- Modify: `frontend/src/components/ui/card.tsx`
- Modify: `frontend/src/components/ui/table.tsx`
- Modify: `frontend/src/components/ui/input.tsx`
- Modify: `frontend/src/components/ui/dialog.tsx`

**Interfaces:**
- Consumes: CSS tokens from Task 1
- Produces: Refined UI primitives with 4-6px radius, cleaner borders, lighter shadows

- [ ] **Step 1: Update badge.tsx** — replace `rounded-4xl` with `rounded-[3px]`, refine variants

Replace the `badgeVariants` cva call:

```tsx
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[3px] border border-transparent px-2 py-0.5 text-[10px] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-critical-bg text-critical-text",
        outline: "border-border text-foreground",
        ghost: "hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

- [ ] **Step 2: Update card.tsx** — change `rounded-xl` to `rounded-[6px]`, replace ring with border+shadow

Replace the Card className:

```tsx
"group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-[6px] bg-card py-(--card-spacing) text-sm text-card-foreground border border-border shadow-sm [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)]",
```

Replace `CardHeader` className:

```tsx
"group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-[6px] px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
```

Replace `CardFooter` className:

```tsx
"flex items-center rounded-b-[6px] border-t bg-muted/50 p-(--card-spacing)",
```

- [ ] **Step 3: Update table.tsx** — refine header style, row borders

Replace `TableHead` className:

```tsx
"h-9 px-3 text-left align-middle text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
```

Replace `TableCell` className:

```tsx
"p-2.5 px-3 align-middle whitespace-nowrap text-[13px] [&:has([role=checkbox])]:pr-0",
```

Replace `TableRow` className:

```tsx
"border-b border-muted transition-colors hover:bg-warning-bg/30 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
```

- [ ] **Step 4: Update input.tsx** — 4px radius, refined focus ring

Replace Input className:

```tsx
"h-9 w-full min-w-0 rounded-[4px] border border-input bg-card px-3 py-1.5 text-sm transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
```

- [ ] **Step 5: Update dialog.tsx** — 8px radius, darker overlay

Replace `DialogOverlay` className:

```tsx
"fixed inset-0 isolate z-50 bg-black/40 duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
```

Replace `DialogContent` className:

```tsx
"fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[8px] bg-card p-5 text-sm text-card-foreground shadow-lg border border-border duration-150 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
```

Replace `DialogFooter` className:

```tsx
"-mx-5 -mb-5 flex flex-col-reverse gap-2 rounded-b-[8px] border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
```

- [ ] **Step 6: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/badge.tsx frontend/src/components/ui/card.tsx frontend/src/components/ui/table.tsx frontend/src/components/ui/input.tsx frontend/src/components/ui/dialog.tsx
git commit -m "feat: refine UI primitives with 4-6px radius, cleaner borders, lighter shadows"
```

---

### Task 7: StatusBadge Redesign

**Files:**
- Modify: `frontend/src/components/shared/status-badge.tsx`

**Interfaces:**
- Consumes: CSS tokens from Task 1
- Produces: Status badges with refined color palette matching gold/navy theme

- [ ] **Step 1: Update statusMap with new color classes**

```tsx
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktif', className: 'bg-success-bg text-success-text' },
  ARCHIVED: { label: 'Arşiv', className: 'bg-muted text-muted-foreground' },
  SERVED: { label: 'Tebliğ Edildi', className: 'bg-success-bg text-success-text' },
  RETURNED: { label: 'İade', className: 'bg-critical-bg text-critical-text' },
  CRITICAL: { label: 'Kritik', className: 'bg-critical-bg text-critical-text' },
  KRITIK: { label: 'Kritik', className: 'bg-critical-bg text-critical-text' },
  WARNING: { label: 'Uyarı', className: 'bg-warning-bg text-warning-text' },
  YAKLASIYOR: { label: 'Yaklaşıyor', className: 'bg-warning-bg text-warning-text' },
  TAKIP: { label: 'Takip', className: 'bg-warning-bg text-warning-text' },
  NORMAL: { label: 'Normal', className: 'bg-normal-bg text-normal-text' },
  CREATED: { label: 'Oluşturuldu', className: 'bg-normal-bg text-normal-text' },
  BEKLIYOR: { label: 'Bekliyor', className: 'bg-normal-bg text-normal-text' },
  MUZEKKERE_REQUIRED: { label: 'Müzekkere Gerekli', className: 'bg-warning-bg text-warning-text' },
  PAID: { label: 'Ödendi', className: 'bg-success-bg text-success-text' },
  PENDING: { label: 'Beklemede', className: 'bg-normal-bg text-normal-text' },
  TRANSFERRED: { label: 'Gönderildi', className: 'bg-success-bg text-success-text' },
  UNREAD: { label: 'Okunmadı', className: 'bg-normal-bg text-normal-text' },
  READ: { label: 'Okundu', className: 'bg-muted text-muted-foreground' },
  COMPLETED: { label: 'Tamamlandı', className: 'bg-success-bg text-success-text' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <span className={cn('inline-flex items-center rounded-[3px] px-2 py-0.5 text-[10px] font-medium', config.className, className)}>
      {config.label}
    </span>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/shared/status-badge.tsx
git commit -m "feat: redesign status badges with refined color palette"
```

---

### Task 8: StatsCard and SuggestionBox Redesign

**Files:**
- Modify: `frontend/src/components/dashboard/stats-card.tsx`
- Modify: `frontend/src/components/dashboard/suggestion-box.tsx`

**Interfaces:**
- Consumes: CSS tokens from Task 1
- Produces: Premium stat cards with left border accent, gradient suggestion box

- [ ] **Step 1: Update stats-card.tsx**

```tsx
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: 'red' | 'amber' | 'blue' | 'green';
  onClick?: () => void;
}

const colorClasses = {
  red: 'border-l-[3px] border-l-destructive',
  amber: 'border-l-[3px] border-l-gold',
  blue: 'border-l-[3px] border-l-info',
  green: 'border-l-[3px] border-l-success',
};

const iconBgClasses = {
  red: 'bg-critical-bg text-critical-text',
  amber: 'bg-warning-bg text-gold-dark',
  blue: 'bg-normal-bg text-info',
  green: 'bg-success-bg text-success-text',
};

export function StatsCard({ title, count, icon: Icon, color, onClick }: StatsCardProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-[6px] border border-border bg-card p-3.5 shadow-sm transition-colors',
        colorClasses[color],
        onClick && 'cursor-pointer hover:bg-muted/30'
      )}
      onClick={onClick}
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-[6px]', iconBgClasses[color])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-[22px] font-bold text-foreground leading-tight">{count}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update suggestion-box.tsx**

```tsx
import { Info } from 'lucide-react';

interface SuggestionBoxProps {
  message: string;
}

export function SuggestionBox({ message }: SuggestionBoxProps) {
  return (
    <div className="rounded-[6px] border border-border bg-gradient-to-r from-blue-50 to-gold/5 p-3.5">
      <div className="flex items-start gap-3">
        <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-foreground/80">{message}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/dashboard/stats-card.tsx frontend/src/components/dashboard/suggestion-box.tsx
git commit -m "feat: premium stat cards with left border, gradient suggestion box"
```

---

### Task 9: DataTable Redesign

**Files:**
- Modify: `frontend/src/components/shared/data-table.tsx`

**Interfaces:**
- Consumes: Updated Table, Input, Button components
- Produces: Refined data table with cleaner search, pagination

- [ ] **Step 1: Update data-table.tsx styling**

```tsx
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, Search } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
}

export function DataTable<T extends Record<string, unknown> | object>({
  columns,
  data,
  searchPlaceholder = 'Ara...',
  onRowClick,
  page = 1,
  totalPages = 1,
  onPageChange,
  loading,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        const val = (item as Record<string, unknown>)[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), 'tr');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative max-w-[250px]">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-[13px]"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Yükleniyor...</div>
      ) : (
        <>
          <div className="rounded-[6px] border border-border bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead
                      key={col.key}
                      className={col.sortable ? 'cursor-pointer select-none' : ''}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-1">
                        {col.header}
                        {sortKey === col.key && (
                          sortDir === 'asc' ? <ChevronsUp className="h-3 w-3" /> : <ChevronsDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                      Sonuç bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((item, i) => (
                    <TableRow
                      key={i}
                      className={onRowClick ? 'cursor-pointer' : ''}
                      onClick={() => onRowClick?.(item)}
                    >
                      {columns.map((col) => (
                        <TableCell key={col.key} className={col.className}>
                          {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Toplam {totalPages} sayfa
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => onPageChange?.(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-[3px] bg-navy text-white text-[11px] font-medium">
                  {page}
                </span>
                <Button variant="outline" size="sm" onClick={() => onPageChange?.(page + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/shared/data-table.tsx
git commit -m "feat: refine data table with card wrapper, navy page indicator"
```

---

### Task 10: Login Page Redesign

**Files:**
- Modify: `frontend/src/pages/login.tsx`

**Interfaces:**
- Consumes: CSS tokens, updated Button, Input, Card
- Produces: Premium login page with gradient background, centered card, gold logo

- [ ] **Step 1: Replace login.tsx with premium design**

```tsx
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-[#1a2f4a] to-navy p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #c9a84c 0, #c9a84c 1px, transparent 1px, transparent 20px)' }} />

      <div className="w-full max-w-[380px] rounded-[8px] border border-border bg-card p-8 shadow-lg relative z-10">
        <div className="text-center mb-7">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl text-gold">&#9878;</span>
            <span className="text-[22px] font-bold text-foreground font-[family-name:Georgia,serif]">MudurPro</span>
          </div>
          <p className="text-[12px] text-muted-foreground">Yazı İşleri Müdürü Süre Takip Sistemi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-[4px] bg-critical-bg p-3 text-[12px] text-critical-text">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[11px] font-medium text-foreground/80">E-posta</label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@adliye.gov.tr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[11px] font-medium text-foreground/80">Şifre</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full h-10 text-[13px] font-semibold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Giriş Yap
          </Button>
        </form>

        <p className="text-center mt-6 text-[10px] text-muted-foreground">
          MudurPro v1.0 — Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/login.tsx
git commit -m "feat: premium login page with navy gradient bg, gold logo"
```

---

### Task 11: Dashboard Page Redesign

**Files:**
- Modify: `frontend/src/pages/dashboard.tsx`

**Interfaces:**
- Consumes: Redesigned StatsCard, SuggestionBox, CriticalTable (if exists)
- Produces: Premium dashboard with serif title, refined stats grid, activity list

- [ ] **Step 1: Replace dashboard.tsx with premium design**

```tsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { StatsCard } from '@/components/dashboard/stats-card';
import { CriticalTable } from '@/components/dashboard/critical-table';
import { SuggestionBox } from '@/components/dashboard/suggestion-box';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { AlertTriangle, Send, CheckCircle, Banknote, Undo2 } from 'lucide-react';

interface DashboardData {
  criticalDeadlines: { count: number; items: Array<{ id: string; caseId: string; esasNo: string; remainingDays?: number }> };
  pendingServices: { count: number; items: Array<{ id: string; caseId: string; esasNo: string }> };
  readyForFinalization: { count: number; items: Array<{ id: string; caseId: string; esasNo: string; remainingDays?: number }> };
  feeMuzekkereRequired: { count: number; items: Array<{ id: string; caseId: string; esasNo: string }> };
  returnedServices: { count: number; items: Array<{ id: string; caseId: string; esasNo: string }> };
  recentActivity: { count: number; items: Array<{ id: string; caseId: string; esasNo: string; title?: string }> };
}

export default function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const d = data!;

  const suggestionMessages: string[] = [];
  if (d.criticalDeadlines.count > 0) suggestionMessages.push(`${d.criticalDeadlines.count} dosyada kritik süre aşımı var. Hemen işlem yapın.`);
  if (d.pendingServices.count > 0) suggestionMessages.push(`${d.pendingServices.count} dosyada bekleyen tebligat bulunuyor.`);
  if (d.returnedServices.count > 0) suggestionMessages.push(`${d.returnedServices.count} tebligat iade edildi. Adres kontrolü yapın.`);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground font-[family-name:Georgia,serif]">Dashboard</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Genel durum özeti ve kritik bildirimler</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Kritik Süreler" count={d.criticalDeadlines.count} icon={AlertTriangle} color="red" onClick={() => navigate('/cases')} />
        <StatsCard title="Bekleyen Tebligat" count={d.pendingServices.count} icon={Send} color="amber" onClick={() => navigate('/cases')} />
        <StatsCard title="Kesinleşmeye Hazır" count={d.readyForFinalization.count} icon={CheckCircle} color="green" onClick={() => navigate('/cases')} />
        <StatsCard title="Harç Gereken" count={d.feeMuzekkereRequired.count} icon={Banknote} color="blue" onClick={() => navigate('/cases')} />
      </div>

      {d.returnedServices.count > 0 && (
        <StatsCard title="İade Edilen Tebligat" count={d.returnedServices.count} icon={Undo2} color="red" onClick={() => navigate('/cases')} />
      )}

      {suggestionMessages.length > 0 && <SuggestionBox message={suggestionMessages.join(' ')} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CriticalTable items={d.criticalDeadlines.items} title="Kritik Süreler" />
        <CriticalTable items={d.pendingServices.items} title="Bekleyen Tebligatlar" />
      </div>

      {d.recentActivity.items.length > 0 && (
        <div className="rounded-[6px] border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-xs font-semibold text-foreground font-[family-name:Georgia,serif]">Son İşlemler</h3>
          </div>
          <div className="divide-y divide-muted">
            {d.recentActivity.items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-warning-bg/20 transition-colors"
                onClick={() => item.caseId && navigate(`/cases/${item.caseId}`)}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="text-[12px] text-foreground">{item.title}</span>
                </div>
                {item.esasNo && <span className="text-[11px] text-muted-foreground">{item.esasNo}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/dashboard.tsx
git commit -m "feat: premium dashboard with serif titles, refined stat grid, activity dots"
```

---

### Task 12: Cases List Page Redesign

**Files:**
- Modify: `frontend/src/pages/cases.tsx`

**Interfaces:**
- Consumes: Redesigned Button, Dialog, DataTable, StatusBadge
- Produces: Premium cases page with serif title, gold new-case button, refined table

- [ ] **Step 1: Replace cases.tsx with premium design**

```tsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api-client';
import { DataTable } from '@/components/shared/data-table';
import type { Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { CaseFileForm } from '@/components/case-file/case-file-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface CaseFile {
  id: string;
  esas_no: string;
  karar_no: string | null;
  durum: string;
  court_id: string;
}

export default function Cases() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{ data: CaseFile[]; total: number; page: number; totalPages: number }>({
    queryKey: ['cases', page],
    queryFn: async () => {
      const res = await apiClient.get('/cases', { params: { page, limit: 20 } });
      return res.data.data;
    },
  });

  const columns: Column<CaseFile>[] = [
    { key: 'esas_no', header: 'Esas No', sortable: true },
    {
      key: 'karar_no',
      header: 'Karar No',
      render: (item) => item.karar_no || '-',
    },
    {
      key: 'durum',
      header: 'Durum',
      render: (item) => <StatusBadge status={item.durum} />,
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground font-[family-name:Georgia,serif]">Dosyalar</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Mahkeme dosyalarını görüntüleyin ve yönetin</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-[4px] bg-gradient-to-br from-gold to-gold-dark px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          Yeni Dosya
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        searchPlaceholder="Esas no ile ara..."
        onRowClick={(item) => navigate(`/cases/${item.id}`)}
        page={data?.page || 1}
        totalPages={data?.totalPages || 1}
        onPageChange={setPage}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Dosya</DialogTitle>
          </DialogHeader>
          <CaseFileForm
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ['cases'] });
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/cases.tsx
git commit -m "feat: premium cases page with serif title, gold button"
```

---

### Task 13: Case Detail Page Redesign

**Files:**
- Modify: `frontend/src/pages/case-detail.tsx` (find and read actual path first)

**Interfaces:**
- Consumes: CSS tokens, redesigned UI components, StatusBadge
- Produces: Premium case detail with breadcrumb nav, info card, gold tab underline

**Note:** Read the actual case detail file before implementing. The structure should include:
- Back link breadcrumb: "← Dosyalar | 2024/456 E."
- Case info card grid (Esas No, Karar No, Tarih, Durum)
- Tab bar with gold underline on active tab (Taraflar, Tebligatlar, İtirazlar, Harçlar)
- Refined party/service/appeal/fee tables with gold outline add buttons

- [ ] **Step 1: Find and read case detail page**

Use glob/grep to find the case detail page file, then read it before implementing changes.

- [ ] **Step 2: Apply premium styling**

Update the page with:
- Serif font page title (`font-[family-name:Georgia,serif]`)
- Breadcrumb with muted back arrow
- Info card: `rounded-[6px] border border-border bg-card shadow-sm`
- Tab active: `border-b-2 border-b-gold text-gold font-semibold`
- Tab inactive: `text-muted-foreground hover:text-foreground`
- "Ekle" buttons: `border border-gold text-gold rounded-[3px] text-[10px]`

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add <case-detail-file>
git commit -m "feat: premium case detail with breadcrumb, gold tabs, info card"
```

---

### Task 14: CriticalTable Redesign

**Files:**
- Modify: `frontend/src/components/dashboard/critical-table.tsx` (find and read first)

**Interfaces:**
- Consumes: CSS tokens
- Produces: Refined critical items table with gold-accented header

- [ ] **Step 1: Find and read critical-table.tsx**

Use glob/grep to find the file, then read it before implementing changes.

- [ ] **Step 2: Apply premium styling**

Update with:
- Card wrapper: `rounded-[6px] border border-border bg-card shadow-sm overflow-hidden`
- Header: `font-[family-name:Georgia,serif] text-xs font-semibold`
- Critical row: `text-critical-text font-medium`
- Remaining days badge: `bg-critical-bg text-critical-text`

- [ ] **Step 3: Verify build and commit**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors. Then commit.

---

### Task 15: Remaining Pages Style Update

**Files:**
- Modify: All remaining page files (`notifications.tsx`, `audit-log-viewer.tsx`, `user-management.tsx`, `courthouse-management.tsx`, `court-management.tsx`)

**Interfaces:**
- Consumes: Redesigned layout, UI components
- Produces: Consistent premium styling across all pages

- [ ] **Step 1: Find all remaining page files**

Use glob to find all page files under `frontend/src/pages/`.

- [ ] **Step 2: For each page, apply consistent styling**

Apply these changes to every page:
- Page title: `text-lg font-bold font-[family-name:Georgia,serif]`
- Subtitle: `text-[11px] text-muted-foreground mt-0.5`
- Page wrapper: `space-y-5` (was `space-y-6`)
- "Ekle" buttons: gold gradient matching header button style

- [ ] **Step 3: Verify build and commit**

Run: `npx tsc --noEmit` from `frontend/`
Expected: No errors. Then commit per page or as one batch.

---

### Task 16: Final Verification

**Files:**
- All modified files

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 2: Build check**

```bash
npm run build
```
Expected: Build succeeds.

- [ ] **Step 3: Visual spot check**

Start dev server (`npm run dev`) and verify:
- Login page: gradient background, centered card, gold logo
- Sidebar: navy background, gold active item, 200px width
- Header: gold gradient "Yeni Dosya" button
- Dashboard: stats cards with left border, serif title
- Cases: refined table, serif title
- Case detail: gold tabs, breadcrumb

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete premium UI redesign — navy + gold corporate theme"
```

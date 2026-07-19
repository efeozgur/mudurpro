### Task 1.3: React Frontend Scaffold

**Files:**
- Create: `frontend/` (via Vite scaffold)
- Install: Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod, React Router, Axios, lucide-react
- Create: `frontend/src/lib/api-client.ts`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/pages/login.tsx` (placeholder)
- Create: `frontend/src/main.tsx`

**Steps:**

- [ ] **Step 1: Scaffold via Vite**
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Install dependencies**
```bash
npm install @tanstack/react-query react-hook-form @hookform/resolvers zod react-router-dom axios lucide-react tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configure Tailwind** — Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:3000' } }
})
```

- [ ] **Step 4: Add Tailwind to CSS** — `frontend/src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 5: Install shadcn/ui** — Add shadcn/ui manually (non-interactive approach):
```bash
npx shadcn@latest init -d
```
Then add components:
```bash
npx shadcn@latest add -y button input card table badge dialog dropdown-menu form select calendar popover tabs separator sheet avatar tooltip
```

If `npx shadcn` fails due to path issues, create `frontend/components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```
And create `frontend/src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

- [ ] **Step 6: Create api-client.ts**
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) { config.headers.Authorization = `Bearer ${token}`; }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

- [ ] **Step 7: Create App.tsx**
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 8: Create login.tsx (placeholder)**
```tsx
export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">
        <h1 className="text-2xl font-bold text-center mb-6">MudurPro</h1>
        <p className="text-slate-500 text-center">Giriş yaparak devam edin</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Clean up main.tsx** — Remove default Vite content, keep:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 10: Verify** — Run `npm run dev`, confirm frontend compiles and shows placeholder login page at `http://localhost:5173/login`.

- [ ] **Step 11: Add frontend/.gitignore** if not already created by Vite (node_modules, dist).

- [ ] **Step 12: Commit**
```bash
git add frontend/
git commit -m "feat: scaffold React frontend with Vite, Tailwind, shadcn/ui, TanStack Query, placeholder login"
```

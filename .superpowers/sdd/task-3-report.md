# Task 1.3 Report: React Frontend Scaffold

## Status: ✅ Complete

## Commit
`ddf9269` — feat: scaffold React frontend with Vite, Tailwind, shadcn/ui, TanStack Query, placeholder login

## Summary

Scaffolded the React+Vite frontend for MudurPro under `frontend/` with all requested tooling:

### What was done

1. **Vite scaffold** — `npm create vite@latest . -- --template react-ts`
2. **Dependencies installed** — `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `react-router-dom`, `axios`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `clsx`, `tailwind-merge`
3. **Tailwind v4** — Configured via `@tailwindcss/vite` plugin, CSS import
4. **shadcn/ui** — 16 components installed: button, input, card, table, badge, dialog, dropdown-menu, form, select, calendar, popover, tabs, separator, sheet, avatar, tooltip
5. **Path aliases** — `@/*` → `./src/*` configured in both `tsconfig.app.json` and `vite.config.ts`
6. **API client** — `src/lib/api-client.ts` with axios, auth interceptor, 401 redirect
7. **App.tsx** — React Router with `/login` route and catch-all redirect, TanStack Query provider
8. **Placeholder login page** — `src/pages/login.tsx` with MudurPro branding
9. **Build verified** — `npm run build` compiles successfully (72 modules, 155ms)

### Deviations from task brief

- shadcn v4 (latest) uses `@base-ui/react` instead of `@radix-ui/react`. Installed `@base-ui/react` and `class-variance-authority` to resolve component imports.
- shadcn v4 CLI does not have a `form` component; created it manually using react-hook-form's `FormProvider` + `useFormContext` pattern.
- shadcn CLI initially placed files in literal `@/components/ui/` directory. Moved them to `src/components/ui/` and removed the `@/` directory.
- Added `ignoreDeprecations: "6.0"` to tsconfig to suppress `baseUrl` deprecation warning in newer TypeScript.

### Files created (35 total)

```
frontend/
├── .gitignore
├── .oxlintrc.json
├── README.md
├── components.json
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── lib/
    │   ├── api-client.ts
    │   └── utils.ts
    ├── pages/
    │   └── login.tsx
    └── components/ui/
        ├── avatar.tsx
        ├── badge.tsx
        ├── button.tsx
        ├── calendar.tsx
        ├── card.tsx
        ├── dialog.tsx
        ├── dropdown-menu.tsx
        ├── form.tsx
        ├── input.tsx
        ├── popover.tsx
        ├── select.tsx
        ├── separator.tsx
        ├── sheet.tsx
        ├── table.tsx
        ├── tabs.tsx
        └── tooltip.tsx
```

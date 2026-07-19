 frontend/.gitignore                          |   24 +
 frontend/.oxlintrc.json                      |    8 +
 frontend/README.md                           |   32 +
 frontend/components.json                     |   25 +
 frontend/index.html                          |   13 +
 frontend/package-lock.json                   | 2360 ++++++++++++++++++++++++++
 frontend/package.json                        |   40 +
 frontend/public/favicon.svg                  |    1 +
 frontend/public/icons.svg                    |   24 +
 frontend/src/App.tsx                         |   22 +
 frontend/src/components/ui/avatar.tsx        |  107 ++
 frontend/src/components/ui/badge.tsx         |   52 +
 frontend/src/components/ui/button.tsx        |   58 +
 frontend/src/components/ui/calendar.tsx      |  221 +++
 frontend/src/components/ui/card.tsx          |  103 ++
 frontend/src/components/ui/dialog.tsx        |  158 ++
 frontend/src/components/ui/dropdown-menu.tsx |  268 +++
 frontend/src/components/ui/form.tsx          |  175 ++
 frontend/src/components/ui/input.tsx         |   20 +
 frontend/src/components/ui/popover.tsx       |   90 +
 frontend/src/components/ui/select.tsx        |  199 +++
 frontend/src/components/ui/separator.tsx     |   25 +
 frontend/src/components/ui/sheet.tsx         |  136 ++
 frontend/src/components/ui/table.tsx         |  114 ++
 frontend/src/components/ui/tabs.tsx          |   80 +
 frontend/src/components/ui/tooltip.tsx       |   66 +
 frontend/src/index.css                       |    1 +
 frontend/src/lib/api-client.ts               |   25 +
 frontend/src/lib/utils.ts                    |    3 +
 frontend/src/main.tsx                        |   10 +
 frontend/src/pages/login.tsx                 |   10 +
 frontend/tsconfig.app.json                   |   29 +
 frontend/tsconfig.json                       |    7 +
 frontend/tsconfig.node.json                  |   23 +
 frontend/vite.config.ts                      |   10 +
 35 files changed, 4539 insertions(+)

---

diff --git a/frontend/components.json b/frontend/components.json
new file mode 100644
index 0000000..15addee
--- /dev/null
+++ b/frontend/components.json
@@ -0,0 +1,25 @@
+{
+  "$schema": "https://ui.shadcn.com/schema.json",
+  "style": "base-nova",
+  "rsc": false,
+  "tsx": true,
+  "tailwind": {
+    "config": "",
+    "css": "src/index.css",
+    "baseColor": "neutral",
+    "cssVariables": true,
+    "prefix": ""
+  },
+  "iconLibrary": "lucide",
+  "rtl": false,
+  "aliases": {
+    "components": "@/components",
+    "utils": "@/lib/utils",
+    "ui": "@/components/ui",
+    "lib": "@/lib",
+    "hooks": "@/hooks"
+  },
+  "menuColor": "default",
+  "menuAccent": "subtle",
+  "registries": {}
+}
diff --git a/frontend/index.html b/frontend/index.html
new file mode 100644
index 0000000..0fca6f0
--- /dev/null
+++ b/frontend/index.html
@@ -0,0 +1,13 @@
+<!doctype html>
+<html lang="en">
+  <head>
+    <meta charset="UTF-8" />
+    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
+    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
+    <title>frontend</title>
+  </head>
+  <body>
+    <div id="root"></div>
+    <script type="module" src="/src/main.tsx"></script>
+  </body>
+</html>
diff --git a/frontend/src/App.tsx b/frontend/src/App.tsx
new file mode 100644
index 0000000..394d11f
--- /dev/null
+++ b/frontend/src/App.tsx
@@ -0,0 +1,22 @@
+import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
+import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
+import Login from './pages/login';
+
+const queryClient = new QueryClient({
+  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
+});
+
+function App() {
+  return (
+    <QueryClientProvider client={queryClient}>
+      <BrowserRouter>
+        <Routes>
+          <Route path="/login" element={<Login />} />
+          <Route path="*" element={<Navigate to="/login" replace />} />
+        </Routes>
+      </BrowserRouter>
+    </QueryClientProvider>
+  );
+}
+
+export default App;
diff --git a/frontend/src/components/ui/avatar.tsx b/frontend/src/components/ui/avatar.tsx
new file mode 100644
index 0000000..e92a2f4
--- /dev/null
+++ b/frontend/src/components/ui/avatar.tsx
@@ -0,0 +1,107 @@
+import * as React from "react"
+import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
+
+import { cn } from "@/lib/utils"
+
+function Avatar({
+  className,
+  size = "default",
+  ...props
+}: AvatarPrimitive.Root.Props & {
+  size?: "default" | "sm" | "lg"
+}) {
+  return (
+    <AvatarPrimitive.Root
+      data-slot="avatar"
+      data-size={size}
+      className={cn(
+        "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
+  return (
+    <AvatarPrimitive.Image
+      data-slot="avatar-image"
+      className={cn(
+        "aspect-square size-full rounded-full object-cover",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function AvatarFallback({
+  className,
+  ...props
+}: AvatarPrimitive.Fallback.Props) {
+  return (
+    <AvatarPrimitive.Fallback
+      data-slot="avatar-fallback"
+      className={cn(
+        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
+  return (
+    <span
+      data-slot="avatar-badge"
+      className={cn(
+        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
+        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
+        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
+        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="avatar-group"
+      className={cn(
+        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function AvatarGroupCount({
+  className,
+  ...props
+}: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="avatar-group-count"
+      className={cn(
+        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export {
+  Avatar,
+  AvatarImage,
+  AvatarFallback,
+  AvatarGroup,
+  AvatarGroupCount,
+  AvatarBadge,
+}
diff --git a/frontend/src/components/ui/badge.tsx b/frontend/src/components/ui/badge.tsx
new file mode 100644
index 0000000..b20959d
--- /dev/null
+++ b/frontend/src/components/ui/badge.tsx
@@ -0,0 +1,52 @@
+import { mergeProps } from "@base-ui/react/merge-props"
+import { useRender } from "@base-ui/react/use-render"
+import { cva, type VariantProps } from "class-variance-authority"
+
+import { cn } from "@/lib/utils"
+
+const badgeVariants = cva(
+  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
+  {
+    variants: {
+      variant: {
+        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
+        secondary:
+          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
+        destructive:
+          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
+        outline:
+          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
+        ghost:
+          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
+        link: "text-primary underline-offset-4 hover:underline",
+      },
+    },
+    defaultVariants: {
+      variant: "default",
+    },
+  }
+)
+
+function Badge({
+  className,
+  variant = "default",
+  render,
+  ...props
+}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
+  return useRender({
+    defaultTagName: "span",
+    props: mergeProps<"span">(
+      {
+        className: cn(badgeVariants({ variant }), className),
+      },
+      props
+    ),
+    render,
+    state: {
+      slot: "badge",
+      variant,
+    },
+  })
+}
+
+export { Badge, badgeVariants }
diff --git a/frontend/src/components/ui/button.tsx b/frontend/src/components/ui/button.tsx
new file mode 100644
index 0000000..b033601
--- /dev/null
+++ b/frontend/src/components/ui/button.tsx
@@ -0,0 +1,58 @@
+import { Button as ButtonPrimitive } from "@base-ui/react/button"
+import { cva, type VariantProps } from "class-variance-authority"
+
+import { cn } from "@/lib/utils"
+
+const buttonVariants = cva(
+  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
+  {
+    variants: {
+      variant: {
+        default: "bg-primary text-primary-foreground hover:bg-primary/80",
+        outline:
+          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
+        secondary:
+          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
+        ghost:
+          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
+        destructive:
+          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
+        link: "text-primary underline-offset-4 hover:underline",
+      },
+      size: {
+        default:
+          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
+        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
+        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
+        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
+        icon: "size-8",
+        "icon-xs":
+          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
+        "icon-sm":
+          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
+        "icon-lg": "size-9",
+      },
+    },
+    defaultVariants: {
+      variant: "default",
+      size: "default",
+    },
+  }
+)
+
+function Button({
+  className,
+  variant = "default",
+  size = "default",
+  ...props
+}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
+  return (
+    <ButtonPrimitive
+      data-slot="button"
+      className={cn(buttonVariants({ variant, size, className }))}
+      {...props}
+    />
+  )
+}
+
+export { Button, buttonVariants }
diff --git a/frontend/src/components/ui/calendar.tsx b/frontend/src/components/ui/calendar.tsx
new file mode 100644
index 0000000..0f8950a
--- /dev/null
+++ b/frontend/src/components/ui/calendar.tsx
@@ -0,0 +1,221 @@
+"use client"
+
+import * as React from "react"
+import {
+  DayPicker,
+  getDefaultClassNames,
+  type DayButton,
+  type Locale,
+} from "react-day-picker"
+
+import { cn } from "@/lib/utils"
+import { Button, buttonVariants } from "@/components/ui/button"
+import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"
+
+function Calendar({
+  className,
+  classNames,
+  showOutsideDays = true,
+  captionLayout = "label",
+  buttonVariant = "ghost",
+  locale,
+  formatters,
+  components,
+  ...props
+}: React.ComponentProps<typeof DayPicker> & {
+  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
+}) {
+  const defaultClassNames = getDefaultClassNames()
+
+  return (
+    <DayPicker
+      showOutsideDays={showOutsideDays}
+      className={cn(
+        "group/calendar bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
+        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
+        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
+        className
+      )}
+      captionLayout={captionLayout}
+      locale={locale}
+      formatters={{
+        formatMonthDropdown: (date) =>
+          date.toLocaleString(locale?.code, { month: "short" }),
+        ...formatters,
+      }}
+      classNames={{
+        root: cn("w-fit", defaultClassNames.root),
+        months: cn(
+          "relative flex flex-col gap-4 md:flex-row",
+          defaultClassNames.months
+        ),
+        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
+        nav: cn(
+          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
+          defaultClassNames.nav
+        ),
+        button_previous: cn(
+          buttonVariants({ variant: buttonVariant }),
+          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
+          defaultClassNames.button_previous
+        ),
+        button_next: cn(
+          buttonVariants({ variant: buttonVariant }),
+          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
+          defaultClassNames.button_next
+        ),
+        month_caption: cn(
+          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
+          defaultClassNames.month_caption
+        ),
+        dropdowns: cn(
+          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
+          defaultClassNames.dropdowns
+        ),
+        dropdown_root: cn(
+          "relative rounded-(--cell-radius)",
+          defaultClassNames.dropdown_root
+        ),
+        dropdown: cn(
+          "absolute inset-0 bg-popover opacity-0",
+          defaultClassNames.dropdown
+        ),
+        caption_label: cn(
+          "font-medium select-none",
+          captionLayout === "label"
+            ? "text-sm"
+            : "flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
+          defaultClassNames.caption_label
+        ),
+        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
+        weekdays: cn("flex", defaultClassNames.weekdays),
+        weekday: cn(
+          "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
+          defaultClassNames.weekday
+        ),
+        week: cn("mt-2 flex w-full", defaultClassNames.week),
+        week_number_header: cn(
+          "w-(--cell-size) select-none",
+          defaultClassNames.week_number_header
+        ),
+        week_number: cn(
+          "text-[0.8rem] text-muted-foreground select-none",
+          defaultClassNames.week_number
+        ),
+        day: cn(
+          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
+          props.showWeekNumber
+            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
+            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
+          defaultClassNames.day
+        ),
+        range_start: cn(
+          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
+          defaultClassNames.range_start
+        ),
+        range_middle: cn("rounded-none", defaultClassNames.range_middle),
+        range_end: cn(
+          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
+          defaultClassNames.range_end
+        ),
+        today: cn(
+          "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
+          defaultClassNames.today
+        ),
+        outside: cn(
+          "text-muted-foreground aria-selected:text-muted-foreground",
+          defaultClassNames.outside
+        ),
+        disabled: cn(
+          "text-muted-foreground opacity-50",
+          defaultClassNames.disabled
+        ),
+        hidden: cn("invisible", defaultClassNames.hidden),
+        ...classNames,
+      }}
+      components={{
+        Root: ({ className, rootRef, ...props }) => {
+          return (
+            <div
+              data-slot="calendar"
+              ref={rootRef}
+              className={cn(className)}
+              {...props}
+            />
+          )
+        },
+        Chevron: ({ className, orientation, ...props }) => {
+          if (orientation === "left") {
+            return (
+              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
+            )
+          }
+
+          if (orientation === "right") {
+            return (
+              <ChevronRightIcon className={cn("size-4", className)} {...props} />
+            )
+          }
+
+          return (
+            <ChevronDownIcon className={cn("size-4", className)} {...props} />
+          )
+        },
+        DayButton: ({ ...props }) => (
+          <CalendarDayButton locale={locale} {...props} />
+        ),
+        WeekNumber: ({ children, ...props }) => {
+          return (
+            <td {...props}>
+              <div className="flex size-(--cell-size) items-center justify-center text-center">
+                {children}
+              </div>
+            </td>
+          )
+        },
+        ...components,
+      }}
+      {...props}
+    />
+  )
+}
+
+function CalendarDayButton({
+  className,
+  day,
+  modifiers,
+  locale,
+  ...props
+}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
+  const defaultClassNames = getDefaultClassNames()
+
+  const ref = React.useRef<HTMLButtonElement>(null)
+  React.useEffect(() => {
+    if (modifiers.focused) ref.current?.focus()
+  }, [modifiers.focused])
+
+  return (
+    <Button
+      variant="ghost"
+      size="icon"
+      data-day={day.date.toLocaleDateString(locale?.code)}
+      data-selected-single={
+        modifiers.selected &&
+        !modifiers.range_start &&
+        !modifiers.range_end &&
+        !modifiers.range_middle
+      }
+      data-range-start={modifiers.range_start}
+      data-range-end={modifiers.range_end}
+      data-range-middle={modifiers.range_middle}
+      className={cn(
+        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
+        defaultClassNames.day,
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export { Calendar, CalendarDayButton }
diff --git a/frontend/src/components/ui/card.tsx b/frontend/src/components/ui/card.tsx
new file mode 100644
index 0000000..5d76ebc
--- /dev/null
+++ b/frontend/src/components/ui/card.tsx
@@ -0,0 +1,103 @@
+import * as React from "react"
+
+import { cn } from "@/lib/utils"
+
+function Card({
+  className,
+  size = "default",
+  ...props
+}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
+  return (
+    <div
+      data-slot="card"
+      data-size={size}
+      className={cn(
+        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="card-header"
+      className={cn(
+        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="card-title"
+      className={cn(
+        "text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="card-description"
+      className={cn("text-sm text-muted-foreground", className)}
+      {...props}
+    />
+  )
+}
+
+function CardAction({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="card-action"
+      className={cn(
+        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function CardContent({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="card-content"
+      className={cn("px-(--card-spacing)", className)}
+      {...props}
+    />
+  )
+}
+
+function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="card-footer"
+      className={cn(
+        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export {
+  Card,
+  CardHeader,
+  CardFooter,
+  CardTitle,
+  CardAction,
+  CardDescription,
+  CardContent,
+}
diff --git a/frontend/src/components/ui/dialog.tsx b/frontend/src/components/ui/dialog.tsx
new file mode 100644
index 0000000..b34d1d7
--- /dev/null
+++ b/frontend/src/components/ui/dialog.tsx
@@ -0,0 +1,158 @@
+import * as React from "react"
+import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
+
+import { cn } from "@/lib/utils"
+import { Button } from "@/components/ui/button"
+import { XIcon } from "lucide-react"
+
+function Dialog({ ...props }: DialogPrimitive.Root.Props) {
+  return <DialogPrimitive.Root data-slot="dialog" {...props} />
+}
+
+function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
+  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
+}
+
+function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
+  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
+}
+
+function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
+  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
+}
+
+function DialogOverlay({
+  className,
+  ...props
+}: DialogPrimitive.Backdrop.Props) {
+  return (
+    <DialogPrimitive.Backdrop
+      data-slot="dialog-overlay"
+      className={cn(
+        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function DialogContent({
+  className,
+  children,
+  showCloseButton = true,
+  ...props
+}: DialogPrimitive.Popup.Props & {
+  showCloseButton?: boolean
+}) {
+  return (
+    <DialogPortal>
+      <DialogOverlay />
+      <DialogPrimitive.Popup
+        data-slot="dialog-content"
+        className={cn(
+          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
+          className
+        )}
+        {...props}
+      >
+        {children}
+        {showCloseButton && (
+          <DialogPrimitive.Close
+            data-slot="dialog-close"
+            render={
+              <Button
+                variant="ghost"
+                className="absolute top-2 right-2"
+                size="icon-sm"
+              />
+            }
+          >
+            <XIcon
+            />
+            <span className="sr-only">Close</span>
+          </DialogPrimitive.Close>
+        )}
+      </DialogPrimitive.Popup>
+    </DialogPortal>
+  )
+}
+
+function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="dialog-header"
+      className={cn("flex flex-col gap-2", className)}
+      {...props}
+    />
+  )
+}
+
+function DialogFooter({
+  className,
+  showCloseButton = false,
+  children,
+  ...props
+}: React.ComponentProps<"div"> & {
+  showCloseButton?: boolean
+}) {
+  return (
+    <div
+      data-slot="dialog-footer"
+      className={cn(
+        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
+        className
+      )}
+      {...props}
+    >
+      {children}
+      {showCloseButton && (
+        <DialogPrimitive.Close render={<Button variant="outline" />}>
+          Close
+        </DialogPrimitive.Close>
+      )}
+    </div>
+  )
+}
+
+function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
+  return (
+    <DialogPrimitive.Title
+      data-slot="dialog-title"
+      className={cn(
+        "text-base leading-none font-medium",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function DialogDescription({
+  className,
+  ...props
+}: DialogPrimitive.Description.Props) {
+  return (
+    <DialogPrimitive.Description
+      data-slot="dialog-description"
+      className={cn(
+        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export {
+  Dialog,
+  DialogClose,
+  DialogContent,
+  DialogDescription,
+  DialogFooter,
+  DialogHeader,
+  DialogOverlay,
+  DialogPortal,
+  DialogTitle,
+  DialogTrigger,
+}
diff --git a/frontend/src/components/ui/dropdown-menu.tsx b/frontend/src/components/ui/dropdown-menu.tsx
new file mode 100644
index 0000000..9d5ebbd
--- /dev/null
+++ b/frontend/src/components/ui/dropdown-menu.tsx
@@ -0,0 +1,268 @@
+"use client"
+
+import * as React from "react"
+import { Menu as MenuPrimitive } from "@base-ui/react/menu"
+
+import { cn } from "@/lib/utils"
+import { ChevronRightIcon, CheckIcon } from "lucide-react"
+
+function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
+  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
+}
+
+function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
+  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
+}
+
+function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
+  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
+}
+
+function DropdownMenuContent({
+  align = "start",
+  alignOffset = 0,
+  side = "bottom",
+  sideOffset = 4,
+  className,
+  ...props
+}: MenuPrimitive.Popup.Props &
+  Pick<
+    MenuPrimitive.Positioner.Props,
+    "align" | "alignOffset" | "side" | "sideOffset"
+  >) {
+  return (
+    <MenuPrimitive.Portal>
+      <MenuPrimitive.Positioner
+        className="isolate z-50 outline-none"
+        align={align}
+        alignOffset={alignOffset}
+        side={side}
+        sideOffset={sideOffset}
+      >
+        <MenuPrimitive.Popup
+          data-slot="dropdown-menu-content"
+          className={cn("z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95", className )}
+          {...props}
+        />
+      </MenuPrimitive.Positioner>
+    </MenuPrimitive.Portal>
+  )
+}
+
+function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
+  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
+}
+
+function DropdownMenuLabel({
+  className,
+  inset,
+  ...props
+}: MenuPrimitive.GroupLabel.Props & {
+  inset?: boolean
+}) {
+  return (
+    <MenuPrimitive.GroupLabel
+      data-slot="dropdown-menu-label"
+      data-inset={inset}
+      className={cn(
+        "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:pl-7",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function DropdownMenuItem({
+  className,
+  inset,
+  variant = "default",
+  ...props
+}: MenuPrimitive.Item.Props & {
+  inset?: boolean
+  variant?: "default" | "destructive"
+}) {
+  return (
+    <MenuPrimitive.Item
+      data-slot="dropdown-menu-item"
+      data-inset={inset}
+      data-variant={variant}
+      className={cn(
+        "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
+  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
+}
+
+function DropdownMenuSubTrigger({
+  className,
+  inset,
+  children,
+  ...props
+}: MenuPrimitive.SubmenuTrigger.Props & {
+  inset?: boolean
+}) {
+  return (
+    <MenuPrimitive.SubmenuTrigger
+      data-slot="dropdown-menu-sub-trigger"
+      data-inset={inset}
+      className={cn(
+        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-7 data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
+        className
+      )}
+      {...props}
+    >
+      {children}
+      <ChevronRightIcon className="ml-auto" />
+    </MenuPrimitive.SubmenuTrigger>
+  )
+}
+
+function DropdownMenuSubContent({
+  align = "start",
+  alignOffset = -3,
+  side = "right",
+  sideOffset = 0,
+  className,
+  ...props
+}: React.ComponentProps<typeof DropdownMenuContent>) {
+  return (
+    <DropdownMenuContent
+      data-slot="dropdown-menu-sub-content"
+      className={cn("w-auto min-w-[96px] rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
+      align={align}
+      alignOffset={alignOffset}
+      side={side}
+      sideOffset={sideOffset}
+      {...props}
+    />
+  )
+}
+
+function DropdownMenuCheckboxItem({
+  className,
+  children,
+  checked,
+  inset,
+  ...props
+}: MenuPrimitive.CheckboxItem.Props & {
+  inset?: boolean
+}) {
+  return (
+    <MenuPrimitive.CheckboxItem
+      data-slot="dropdown-menu-checkbox-item"
+      data-inset={inset}
+      className={cn(
+        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
+        className
+      )}
+      checked={checked}
+      {...props}
+    >
+      <span
+        className="pointer-events-none absolute right-2 flex items-center justify-center"
+        data-slot="dropdown-menu-checkbox-item-indicator"
+      >
+        <MenuPrimitive.CheckboxItemIndicator>
+          <CheckIcon
+          />
+        </MenuPrimitive.CheckboxItemIndicator>
+      </span>
+      {children}
+    </MenuPrimitive.CheckboxItem>
+  )
+}
+
+function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
+  return (
+    <MenuPrimitive.RadioGroup
+      data-slot="dropdown-menu-radio-group"
+      {...props}
+    />
+  )
+}
+
+function DropdownMenuRadioItem({
+  className,
+  children,
+  inset,
+  ...props
+}: MenuPrimitive.RadioItem.Props & {
+  inset?: boolean
+}) {
+  return (
+    <MenuPrimitive.RadioItem
+      data-slot="dropdown-menu-radio-item"
+      data-inset={inset}
+      className={cn(
+        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
+        className
+      )}
+      {...props}
+    >
+      <span
+        className="pointer-events-none absolute right-2 flex items-center justify-center"
+        data-slot="dropdown-menu-radio-item-indicator"
+      >
+        <MenuPrimitive.RadioItemIndicator>
+          <CheckIcon
+          />
+        </MenuPrimitive.RadioItemIndicator>
+      </span>
+      {children}
+    </MenuPrimitive.RadioItem>
+  )
+}
+
+function DropdownMenuSeparator({
+  className,
+  ...props
+}: MenuPrimitive.Separator.Props) {
+  return (
+    <MenuPrimitive.Separator
+      data-slot="dropdown-menu-separator"
+      className={cn("-mx-1 my-1 h-px bg-border", className)}
+      {...props}
+    />
+  )
+}
+
+function DropdownMenuShortcut({
+  className,
+  ...props
+}: React.ComponentProps<"span">) {
+  return (
+    <span
+      data-slot="dropdown-menu-shortcut"
+      className={cn(
+        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export {
+  DropdownMenu,
+  DropdownMenuPortal,
+  DropdownMenuTrigger,
+  DropdownMenuContent,
+  DropdownMenuGroup,
+  DropdownMenuLabel,
+  DropdownMenuItem,
+  DropdownMenuCheckboxItem,
+  DropdownMenuRadioGroup,
+  DropdownMenuRadioItem,
+  DropdownMenuSeparator,
+  DropdownMenuShortcut,
+  DropdownMenuSub,
+  DropdownMenuSubTrigger,
+  DropdownMenuSubContent,
+}
diff --git a/frontend/src/components/ui/form.tsx b/frontend/src/components/ui/form.tsx
new file mode 100644
index 0000000..39f2585
--- /dev/null
+++ b/frontend/src/components/ui/form.tsx
@@ -0,0 +1,175 @@
+import * as React from "react"
+import { cn } from "@/lib/utils"
+import {
+  Controller,
+  type ControllerProps,
+  type FieldPath,
+  type FieldValues,
+  FormProvider,
+  useFormContext,
+} from "react-hook-form"
+
+const Form = FormProvider
+
+type FormFieldContextValue<
+  TFieldValues extends FieldValues = FieldValues,
+  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
+> = {
+  name: TName
+}
+
+const FormFieldContext = React.createContext<FormFieldContextValue>(
+  {} as FormFieldContextValue
+)
+
+const FormField = <
+  TFieldValues extends FieldValues = FieldValues,
+  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
+>({
+  ...props
+}: ControllerProps<TFieldValues, TName>) => {
+  return (
+    <FormFieldContext.Provider value={{ name: props.name }}>
+      <Controller {...props} />
+    </FormFieldContext.Provider>
+  )
+}
+
+const useFormField = () => {
+  const fieldContext = React.useContext(FormFieldContext)
+  const itemContext = React.useContext(FormItemContext)
+  const { getFieldState, formState } = useFormContext()
+
+  const fieldState = getFieldState(fieldContext.name, formState)
+
+  if (!fieldContext) {
+    throw new Error("useFormField must be used within <FormField>")
+  }
+
+  const { id } = itemContext
+
+  return {
+    id,
+    name: fieldContext.name,
+    formItemId: `${id}-form-item`,
+    formDescriptionId: `${id}-form-item-description`,
+    formMessageId: `${id}-form-item-message`,
+    ...fieldState,
+  }
+}
+
+type FormItemContextValue = {
+  id: string
+}
+
+const FormItemContext = React.createContext<FormItemContextValue>(
+  {} as FormItemContextValue
+)
+
+const FormItem = React.forwardRef<
+  HTMLDivElement,
+  React.HTMLAttributes<HTMLDivElement>
+>(({ className, ...props }, ref) => {
+  const id = React.useId()
+
+  return (
+    <FormItemContext.Provider value={{ id }}>
+      <div ref={ref} className={cn("space-y-2", className)} {...props} />
+    </FormItemContext.Provider>
+  )
+})
+FormItem.displayName = "FormItem"
+
+const FormLabel = React.forwardRef<
+  HTMLLabelElement,
+  React.HTMLAttributes<HTMLLabelElement> & { error?: boolean }
+>(({ className, error, ...props }, ref) => {
+  const { error: fieldError, formItemId } = useFormField()
+
+  return (
+    <label
+      ref={ref}
+      className={cn(
+        error || fieldError ? "text-destructive" : "",
+        className
+      )}
+      htmlFor={formItemId}
+      {...props}
+    />
+  )
+})
+FormLabel.displayName = "FormLabel"
+
+const FormControl = React.forwardRef<
+  HTMLDivElement,
+  React.HTMLAttributes<HTMLDivElement>
+>(({ ...props }, ref) => {
+  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
+
+  return (
+    <div
+      ref={ref}
+      id={formItemId}
+      aria-describedby={
+        !error
+          ? `${formDescriptionId}`
+          : `${formDescriptionId} ${formMessageId}`
+      }
+      aria-invalid={!!error}
+      {...props}
+    />
+  )
+})
+FormControl.displayName = "FormControl"
+
+const FormDescription = React.forwardRef<
+  HTMLParagraphElement,
+  React.HTMLAttributes<HTMLParagraphElement>
+>(({ className, ...props }, ref) => {
+  const { formDescriptionId } = useFormField()
+
+  return (
+    <p
+      ref={ref}
+      id={formDescriptionId}
+      className={cn("text-sm text-muted-foreground", className)}
+      {...props}
+    />
+  )
+})
+FormDescription.displayName = "FormDescription"
+
+const FormMessage = React.forwardRef<
+  HTMLParagraphElement,
+  React.HTMLAttributes<HTMLParagraphElement>
+>(({ className, children, ...props }, ref) => {
+  const { error, formMessageId } = useFormField()
+  const body = error ? String(error?.message) : children
+
+  if (!body) {
+    return null
+  }
+
+  return (
+    <p
+      ref={ref}
+      id={formMessageId}
+      className={cn("text-sm font-medium text-destructive", className)}
+      {...props}
+    >
+      {body}
+    </p>
+  )
+})
+FormMessage.displayName = "FormMessage"
+
+export {
+  useFormField,
+  Form,
+  FormItem,
+  FormLabel,
+  FormControl,
+  FormDescription,
+  FormMessage,
+  FormField,
+}
diff --git a/frontend/src/components/ui/input.tsx b/frontend/src/components/ui/input.tsx
new file mode 100644
index 0000000..7d21bab
--- /dev/null
+++ b/frontend/src/components/ui/input.tsx
@@ -0,0 +1,20 @@
+import * as React from "react"
+import { Input as InputPrimitive } from "@base-ui/react/input"
+
+import { cn } from "@/lib/utils"
+
+function Input({ className, type, ...props }: React.ComponentProps<"input">) {
+  return (
+    <InputPrimitive
+      type={type}
+      data-slot="input"
+      className={cn(
+        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export { Input }
diff --git a/frontend/src/components/ui/popover.tsx b/frontend/src/components/ui/popover.tsx
new file mode 100644
index 0000000..0b73c6b
--- /dev/null
+++ b/frontend/src/components/ui/popover.tsx
@@ -0,0 +1,90 @@
+"use client"
+
+import * as React from "react"
+import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
+
+import { cn } from "@/lib/utils"
+
+function Popover({ ...props }: PopoverPrimitive.Root.Props) {
+  return <PopoverPrimitive.Root data-slot="popover" {...props} />
+}
+
+function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
+  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
+}
+
+function PopoverContent({
+  className,
+  align = "center",
+  alignOffset = 0,
+  side = "bottom",
+  sideOffset = 4,
+  ...props
+}: PopoverPrimitive.Popup.Props &
+  Pick<
+    PopoverPrimitive.Positioner.Props,
+    "align" | "alignOffset" | "side" | "sideOffset"
+  >) {
+  return (
+    <PopoverPrimitive.Portal>
+      <PopoverPrimitive.Positioner
+        align={align}
+        alignOffset={alignOffset}
+        side={side}
+        sideOffset={sideOffset}
+        className="isolate z-50"
+      >
+        <PopoverPrimitive.Popup
+          data-slot="popover-content"
+          className={cn(
+            "z-50 flex w-72 origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
+            className
+          )}
+          {...props}
+        />
+      </PopoverPrimitive.Positioner>
+    </PopoverPrimitive.Portal>
+  )
+}
+
+function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="popover-header"
+      className={cn("flex flex-col gap-0.5 text-sm", className)}
+      {...props}
+    />
+  )
+}
+
+function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
+  return (
+    <PopoverPrimitive.Title
+      data-slot="popover-title"
+      className={cn("font-medium", className)}
+      {...props}
+    />
+  )
+}
+
+function PopoverDescription({
+  className,
+  ...props
+}: PopoverPrimitive.Description.Props) {
+  return (
+    <PopoverPrimitive.Description
+      data-slot="popover-description"
+      className={cn("text-muted-foreground", className)}
+      {...props}
+    />
+  )
+}
+
+export {
+  Popover,
+  PopoverContent,
+  PopoverDescription,
+  PopoverHeader,
+  PopoverTitle,
+  PopoverTrigger,
+}
diff --git a/frontend/src/components/ui/select.tsx b/frontend/src/components/ui/select.tsx
new file mode 100644
index 0000000..56a7734
--- /dev/null
+++ b/frontend/src/components/ui/select.tsx
@@ -0,0 +1,199 @@
+import * as React from "react"
+import { Select as SelectPrimitive } from "@base-ui/react/select"
+
+import { cn } from "@/lib/utils"
+import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"
+
+const Select = SelectPrimitive.Root
+
+function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
+  return (
+    <SelectPrimitive.Group
+      data-slot="select-group"
+      className={cn("scroll-my-1 p-1", className)}
+      {...props}
+    />
+  )
+}
+
+function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
+  return (
+    <SelectPrimitive.Value
+      data-slot="select-value"
+      className={cn("flex flex-1 text-left", className)}
+      {...props}
+    />
+  )
+}
+
+function SelectTrigger({
+  className,
+  size = "default",
+  children,
+  ...props
+}: SelectPrimitive.Trigger.Props & {
+  size?: "sm" | "default"
+}) {
+  return (
+    <SelectPrimitive.Trigger
+      data-slot="select-trigger"
+      data-size={size}
+      className={cn(
+        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
+        className
+      )}
+      {...props}
+    >
+      {children}
+      <SelectPrimitive.Icon
+        render={
+          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
+        }
+      />
+    </SelectPrimitive.Trigger>
+  )
+}
+
+function SelectContent({
+  className,
+  children,
+  side = "bottom",
+  sideOffset = 4,
+  align = "center",
+  alignOffset = 0,
+  alignItemWithTrigger = true,
+  ...props
+}: SelectPrimitive.Popup.Props &
+  Pick<
+    SelectPrimitive.Positioner.Props,
+    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
+  >) {
+  return (
+    <SelectPrimitive.Portal>
+      <SelectPrimitive.Positioner
+        side={side}
+        sideOffset={sideOffset}
+        align={align}
+        alignOffset={alignOffset}
+        alignItemWithTrigger={alignItemWithTrigger}
+        className="isolate z-50"
+      >
+        <SelectPrimitive.Popup
+          data-slot="select-content"
+          data-align-trigger={alignItemWithTrigger}
+          className={cn("relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
+          {...props}
+        >
+          <SelectScrollUpButton />
+          <SelectPrimitive.List>{children}</SelectPrimitive.List>
+          <SelectScrollDownButton />
+        </SelectPrimitive.Popup>
+      </SelectPrimitive.Positioner>
+    </SelectPrimitive.Portal>
+  )
+}
+
+function SelectLabel({
+  className,
+  ...props
+}: SelectPrimitive.GroupLabel.Props) {
+  return (
+    <SelectPrimitive.GroupLabel
+      data-slot="select-label"
+      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
+      {...props}
+    />
+  )
+}
+
+function SelectItem({
+  className,
+  children,
+  ...props
+}: SelectPrimitive.Item.Props) {
+  return (
+    <SelectPrimitive.Item
+      data-slot="select-item"
+      className={cn(
+        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
+        className
+      )}
+      {...props}
+    >
+      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
+        {children}
+      </SelectPrimitive.ItemText>
+      <SelectPrimitive.ItemIndicator
+        render={
+          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
+        }
+      >
+        <CheckIcon className="pointer-events-none" />
+      </SelectPrimitive.ItemIndicator>
+    </SelectPrimitive.Item>
+  )
+}
+
+function SelectSeparator({
+  className,
+  ...props
+}: SelectPrimitive.Separator.Props) {
+  return (
+    <SelectPrimitive.Separator
+      data-slot="select-separator"
+      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
+      {...props}
+    />
+  )
+}
+
+function SelectScrollUpButton({
+  className,
+  ...props
+}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
+  return (
+    <SelectPrimitive.ScrollUpArrow
+      data-slot="select-scroll-up-button"
+      className={cn(
+        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
+        className
+      )}
+      {...props}
+    >
+      <ChevronUpIcon
+      />
+    </SelectPrimitive.ScrollUpArrow>
+  )
+}
+
+function SelectScrollDownButton({
+  className,
+  ...props
+}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
+  return (
+    <SelectPrimitive.ScrollDownArrow
+      data-slot="select-scroll-down-button"
+      className={cn(
+        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
+        className
+      )}
+      {...props}
+    >
+      <ChevronDownIcon
+      />
+    </SelectPrimitive.ScrollDownArrow>
+  )
+}
+
+export {
+  Select,
+  SelectContent,
+  SelectGroup,
+  SelectItem,
+  SelectLabel,
+  SelectScrollDownButton,
+  SelectScrollUpButton,
+  SelectSeparator,
+  SelectTrigger,
+  SelectValue,
+}
diff --git a/frontend/src/components/ui/separator.tsx b/frontend/src/components/ui/separator.tsx
new file mode 100644
index 0000000..6e1369e
--- /dev/null
+++ b/frontend/src/components/ui/separator.tsx
@@ -0,0 +1,25 @@
+"use client"
+
+import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
+
+import { cn } from "@/lib/utils"
+
+function Separator({
+  className,
+  orientation = "horizontal",
+  ...props
+}: SeparatorPrimitive.Props) {
+  return (
+    <SeparatorPrimitive
+      data-slot="separator"
+      orientation={orientation}
+      className={cn(
+        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+export { Separator }
diff --git a/frontend/src/components/ui/sheet.tsx b/frontend/src/components/ui/sheet.tsx
new file mode 100644
index 0000000..1a2885a
--- /dev/null
+++ b/frontend/src/components/ui/sheet.tsx
@@ -0,0 +1,136 @@
+import * as React from "react"
+import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
+
+import { cn } from "@/lib/utils"
+import { Button } from "@/components/ui/button"
+import { XIcon } from "lucide-react"
+
+function Sheet({ ...props }: SheetPrimitive.Root.Props) {
+  return <SheetPrimitive.Root data-slot="sheet" {...props} />
+}
+
+function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
+  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
+}
+
+function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
+  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
+}
+
+function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
+  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
+}
+
+function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
+  return (
+    <SheetPrimitive.Backdrop
+      data-slot="sheet-overlay"
+      className={cn(
+        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function SheetContent({
+  className,
+  children,
+  side = "right",
+  showCloseButton = true,
+  ...props
+}: SheetPrimitive.Popup.Props & {
+  side?: "top" | "right" | "bottom" | "left"
+  showCloseButton?: boolean
+}) {
+  return (
+    <SheetPortal>
+      <SheetOverlay />
+      <SheetPrimitive.Popup
+        data-slot="sheet-content"
+        data-side={side}
+        className={cn(
+          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
+          className
+        )}
+        {...props}
+      >
+        {children}
+        {showCloseButton && (
+          <SheetPrimitive.Close
+            data-slot="sheet-close"
+            render={
+              <Button
+                variant="ghost"
+                className="absolute top-3 right-3"
+                size="icon-sm"
+              />
+            }
+          >
+            <XIcon
+            />
+            <span className="sr-only">Close</span>
+          </SheetPrimitive.Close>
+        )}
+      </SheetPrimitive.Popup>
+    </SheetPortal>
+  )
+}
+
+function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="sheet-header"
+      className={cn("flex flex-col gap-0.5 p-4", className)}
+      {...props}
+    />
+  )
+}
+
+function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
+  return (
+    <div
+      data-slot="sheet-footer"
+      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
+      {...props}
+    />
+  )
+}
+
+function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
+  return (
+    <SheetPrimitive.Title
+      data-slot="sheet-title"
+      className={cn(
+        "text-base font-medium text-foreground",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function SheetDescription({
+  className,
+  ...props
+}: SheetPrimitive.Description.Props) {
+  return (
+    <SheetPrimitive.Description
+      data-slot="sheet-description"
+      className={cn("text-sm text-muted-foreground", className)}
+      {...props}
+    />
+  )
+}
+
+export {
+  Sheet,
+  SheetTrigger,
+  SheetClose,
+  SheetContent,
+  SheetHeader,
+  SheetFooter,
+  SheetTitle,
+  SheetDescription,
+}
diff --git a/frontend/src/components/ui/table.tsx b/frontend/src/components/ui/table.tsx
new file mode 100644
index 0000000..ac9585e
--- /dev/null
+++ b/frontend/src/components/ui/table.tsx
@@ -0,0 +1,114 @@
+import * as React from "react"
+
+import { cn } from "@/lib/utils"
+
+function Table({ className, ...props }: React.ComponentProps<"table">) {
+  return (
+    <div
+      data-slot="table-container"
+      className="relative w-full overflow-x-auto"
+    >
+      <table
+        data-slot="table"
+        className={cn("w-full caption-bottom text-sm", className)}
+        {...props}
+      />
+    </div>
+  )
+}
+
+function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
+  return (
+    <thead
+      data-slot="table-header"
+      className={cn("[&_tr]:border-b", className)}
+      {...props}
+    />
+  )
+}
+
+function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
+  return (
+    <tbody
+      data-slot="table-body"
+      className={cn("[&_tr:last-child]:border-0", className)}
+      {...props}
+    />
+  )
+}
+
+function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
+  return (
+    <tfoot
+      data-slot="table-footer"
+      className={cn(
+        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
+  return (
+    <tr
+      data-slot="table-row"
+      className={cn(
+        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function TableHead({ className, ...props }: React.ComponentProps<"th">) {
+  return (
+    <th
+      data-slot="table-head"
+      className={cn(
+        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function TableCell({ className, ...props }: React.ComponentProps<"td">) {
+  return (
+    <td
+      data-slot="table-cell"
+      className={cn(
+        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function TableCaption({
+  className,
+  ...props
+}: React.ComponentProps<"caption">) {
+  return (
+    <caption
+      data-slot="table-caption"
+      className={cn("mt-4 text-sm text-muted-foreground", className)}
+      {...props}
+    />
+  )
+}
+
+export {
+  Table,
+  TableHeader,
+  TableBody,
+  TableFooter,
+  TableHead,
+  TableRow,
+  TableCell,
+  TableCaption,
+}
diff --git a/frontend/src/components/ui/tabs.tsx b/frontend/src/components/ui/tabs.tsx
new file mode 100644
index 0000000..2adaeb6
--- /dev/null
+++ b/frontend/src/components/ui/tabs.tsx
@@ -0,0 +1,80 @@
+import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
+import { cva, type VariantProps } from "class-variance-authority"
+
+import { cn } from "@/lib/utils"
+
+function Tabs({
+  className,
+  orientation = "horizontal",
+  ...props
+}: TabsPrimitive.Root.Props) {
+  return (
+    <TabsPrimitive.Root
+      data-slot="tabs"
+      data-orientation={orientation}
+      className={cn(
+        "group/tabs flex gap-2 data-horizontal:flex-col",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+const tabsListVariants = cva(
+  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
+  {
+    variants: {
+      variant: {
+        default: "bg-muted",
+        line: "gap-1 bg-transparent",
+      },
+    },
+    defaultVariants: {
+      variant: "default",
+    },
+  }
+)
+
+function TabsList({
+  className,
+  variant = "default",
+  ...props
+}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
+  return (
+    <TabsPrimitive.List
+      data-slot="tabs-list"
+      data-variant={variant}
+      className={cn(tabsListVariants({ variant }), className)}
+      {...props}
+    />
+  )
+}
+
+function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
+  return (
+    <TabsPrimitive.Tab
+      data-slot="tabs-trigger"
+      className={cn(
+        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
+        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
+        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
+        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
+        className
+      )}
+      {...props}
+    />
+  )
+}
+
+function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
+  return (
+    <TabsPrimitive.Panel
+      data-slot="tabs-content"
+      className={cn("flex-1 text-sm outline-none", className)}
+      {...props}
+    />
+  )
+}
+
+export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
diff --git a/frontend/src/components/ui/tooltip.tsx b/frontend/src/components/ui/tooltip.tsx
new file mode 100644
index 0000000..69e8a82
--- /dev/null
+++ b/frontend/src/components/ui/tooltip.tsx
@@ -0,0 +1,66 @@
+"use client"
+
+import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
+
+import { cn } from "@/lib/utils"
+
+function TooltipProvider({
+  delay = 0,
+  ...props
+}: TooltipPrimitive.Provider.Props) {
+  return (
+    <TooltipPrimitive.Provider
+      data-slot="tooltip-provider"
+      delay={delay}
+      {...props}
+    />
+  )
+}
+
+function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
+  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
+}
+
+function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
+  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
+}
+
+function TooltipContent({
+  className,
+  side = "top",
+  sideOffset = 4,
+  align = "center",
+  alignOffset = 0,
+  children,
+  ...props
+}: TooltipPrimitive.Popup.Props &
+  Pick<
+    TooltipPrimitive.Positioner.Props,
+    "align" | "alignOffset" | "side" | "sideOffset"
+  >) {
+  return (
+    <TooltipPrimitive.Portal>
+      <TooltipPrimitive.Positioner
+        align={align}
+        alignOffset={alignOffset}
+        side={side}
+        sideOffset={sideOffset}
+        className="isolate z-50"
+      >
+        <TooltipPrimitive.Popup
+          data-slot="tooltip-content"
+          className={cn(
+            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
+            className
+          )}
+          {...props}
+        >
+          {children}
+          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
+        </TooltipPrimitive.Popup>
+      </TooltipPrimitive.Positioner>
+    </TooltipPrimitive.Portal>
+  )
+}
+
+export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
diff --git a/frontend/src/index.css b/frontend/src/index.css
new file mode 100644
index 0000000..f1d8c73
--- /dev/null
+++ b/frontend/src/index.css
@@ -0,0 +1 @@
+@import "tailwindcss";
diff --git a/frontend/src/lib/api-client.ts b/frontend/src/lib/api-client.ts
new file mode 100644
index 0000000..e823f6a
--- /dev/null
+++ b/frontend/src/lib/api-client.ts
@@ -0,0 +1,25 @@
+import axios from 'axios';
+
+const apiClient = axios.create({
+  baseURL: '/api/v1',
+  headers: { 'Content-Type': 'application/json' },
+});
+
+apiClient.interceptors.request.use((config) => {
+  const token = localStorage.getItem('access_token');
+  if (token) { config.headers.Authorization = `Bearer ${token}`; }
+  return config;
+});
+
+apiClient.interceptors.response.use(
+  (response) => response,
+  (error) => {
+    if (error.response?.status === 401) {
+      localStorage.removeItem('access_token');
+      window.location.href = '/login';
+    }
+    return Promise.reject(error);
+  },
+);
+
+export default apiClient;
diff --git a/frontend/src/lib/utils.ts b/frontend/src/lib/utils.ts
new file mode 100644
index 0000000..10f8986
--- /dev/null
+++ b/frontend/src/lib/utils.ts
@@ -0,0 +1,3 @@
+import { type ClassValue, clsx } from "clsx"
+import { twMerge } from "tailwind-merge"
+export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
diff --git a/frontend/src/main.tsx b/frontend/src/main.tsx
new file mode 100644
index 0000000..3d7150d
--- /dev/null
+++ b/frontend/src/main.tsx
@@ -0,0 +1,10 @@
+import React from 'react'
+import ReactDOM from 'react-dom/client'
+import App from './App.tsx'
+import './index.css'
+
+ReactDOM.createRoot(document.getElementById('root')!).render(
+  <React.StrictMode>
+    <App />
+  </React.StrictMode>,
+)
diff --git a/frontend/src/pages/login.tsx b/frontend/src/pages/login.tsx
new file mode 100644
index 0000000..807421b
--- /dev/null
+++ b/frontend/src/pages/login.tsx
@@ -0,0 +1,10 @@
+export default function Login() {
+  return (
+    <div className="min-h-screen flex items-center justify-center bg-slate-50">
+      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8">
+        <h1 className="text-2xl font-bold text-center mb-6">MudurPro</h1>
+        <p className="text-slate-500 text-center">Giri┼ş yaparak devam edin</p>
+      </div>
+    </div>
+  );
+}
diff --git a/frontend/vite.config.ts b/frontend/vite.config.ts
new file mode 100644
index 0000000..befb2ed
--- /dev/null
+++ b/frontend/vite.config.ts
@@ -0,0 +1,10 @@
+import { defineConfig } from 'vite'
+import react from '@vitejs/plugin-react'
+import tailwindcss from '@tailwindcss/vite'
+import path from 'path'
+
+export default defineConfig({
+  plugins: [react(), tailwindcss()],
+  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
+  server: { proxy: { '/api': 'http://localhost:3000' } }
+})

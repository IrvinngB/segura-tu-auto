# Estructura del proyecto SeguraTuAuto-React

Este documento describe la estructura principal del proyecto, las carpetas más importantes y el propósito general de cada una.

---

## Vista general de la raíz

```text
segura-tu-auto/
├─ app/
├─ components/
├─ hooks/
├─ lib/
├─ docs/
├─ scripts/
├─ public/
├─ styles/
├─ __tests__/
├─ database.sql
├─ seed-data.sql
├─ .env, .env.local, .env.example, .env.local.template
├─ package.json, package-lock.json, pnpm-lock.yaml
├─ tsconfig.json, tsconfig.tsbuildinfo, next-env.d.ts
├─ next.config.mjs, vercel.json, workflow.json
├─ .eslintrc.json, .prettierrc, .lintstagedrc.json, .gitignore, .vercelignore
├─ jest.config.json, jest.setup.js
├─ components.json, middleware.ts
└─ README.md
```

---

## `app/` – Rutas y vistas (Next.js App Router)

Contiene todas las rutas de la aplicación y sus páginas, usando la carpeta `app` de Next.js.

Subcarpetas y archivos principales:

```text
app/
├─ adjuster/
│  └─ cases/
├─ admin/
│  ├─ assignments/
│  ├─ audit/
│  ├─ documents/
│  ├─ documents-progress/
│  ├─ renewals/
│  └─ reports/
├─ analytics/
├─ api/
│  ├─ adjuster/
│  └─ admin/
├─ auth/
├─ claims/
│  └─ [id]/
├─ clients/
├─ customer/
│  ├─ claims/
│  ├─ communications/
│  ├─ dashboard/
│  ├─ documents/
│  ├─ payment-methods/
│  ├─ payments/
│  ├─ policies/
│  ├─ profile/
│  ├─ quote/
│  ├─ quotes/
│  └─ vehicles/
├─ demo-auto-refresh/
├─ documents/
├─ landing/
├─ login/
├─ notifications/
├─ policies/
│  └─ new/
├─ quotes/
├─ register/
├─ risk-assessment/
├─ settings/
├─ setup-db/
├─ unauthorized/
├─ globals.css
├─ layout.tsx
├─ loading.tsx
└─ page.tsx
```

- **Rutas de negocio**: `adjuster`, `admin`, `customer`, `claims`, `policies`, `quotes`, etc.
- **Rutas de autenticación**: `auth`, `login`, `register`, `unauthorized`.
- **Rutas de soporte**: `analytics`, `documents`, `notifications`, `settings`, `risk-assessment`, `setup-db`, `demo-auto-refresh`, `landing`.
- **Infraestructura de layout**:
  - `layout.tsx`: layout principal de la app.
  - `globals.css`: estilos globales de la app router.
  - `loading.tsx`: pantalla de carga global.
  - `page.tsx`: página raíz (`/`).

Dentro de cada subcarpeta suele haber archivos `page.tsx`, `layout.tsx`, archivos de loading y componentes específicos para esa ruta.

---

## `components/` – Componentes reutilizables

Componentes de UI y componentes específicos por dominio.

Estructura principal:

```text
components/
├─ __tests__/
├─ admin/
├─ auth/
├─ claims/
├─ communications/
├─ customer/
├─ dashboard/
├─ landing/
├─ layout/
├─ modals/
├─ navigation/
├─ notifications/
├─ policies/
├─ quotes/
├─ ui/
├─ vehicles/
├─ admin-quick-access.tsx
├─ theme-provider.tsx
└─ (otros componentes sueltos)
```

### `components/ui/`

Colección de componentes de interfaz reutilizables (basados en librerías tipo shadcn/UI y componentes propios):

- **Componentes de layout**: `card.tsx`, `accordion.tsx`, `collapsible.tsx`, `drawer.tsx`, `sheet.tsx`, `sidebar.tsx`, `scroll-area.tsx`, `resizable.tsx`.
- **Inputs y formularios**: `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `slider.tsx`, `input-otp.tsx`, `form.tsx`.
- **Feedback y estado**: `alert.tsx`, `badge.tsx`, `progress.tsx`, `skeleton.tsx`, `loading-screen.tsx`, `loading-spinner.tsx`, `simple-success-modal.tsx`, `success-modal.tsx`.
- **Overlays y menús**: `dialog.tsx`, `alert-dialog.tsx`, `confirm-dialog.tsx`, `confirmation-modal.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `hover-card.tsx`, `popover.tsx`, `tooltip.tsx`, `notification-modal.tsx`.
- **Navegación**: `tabs.tsx`, `pagination.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `menubar.tsx`, `sidebar.tsx`.
- **Visualización**: `chart.tsx`, `risk-zone-indicator.tsx`, `avatar.tsx`, `aspect-ratio.tsx`.
- **Temas y utilidades**: `theme-toggle.tsx`, `toast.tsx`, `toaster.tsx`, `sonner.tsx`, `portal.tsx`, `lazy-page.tsx`, `auto-refresh-indicator.tsx`, `simple-realtime-indicator.tsx`, `debug-modal.tsx`, `info-tooltip.tsx`.

Además hay componentes por dominio en carpetas como `admin/`, `claims/`, `customer/`, `policies/`, `vehicles/`, etc.

---

## `hooks/` – Hooks personalizados

Hooks de React para encapsular lógica reutilizable del frontend.

Archivos principales:

- `use-claim-actions.ts`
- `use-claim-notifications.ts`
- `use-customer-communications-count.ts`
- `use-customer-data-simple.ts`
- `use-customer-data.ts`
- `use-debounced-value.ts`
- `use-document-count-simple.ts`
- `use-document-count.ts`
- `use-document-request-notifications.ts`
- `use-force-badge-refresh.ts`
- `use-logout.ts`
- `use-mobile.ts`
- `use-optimized-navigation.ts`
- `use-policy-renewal-notifications.ts`
- `use-recent-claims-optimized.ts`
- `use-recent-claims.ts`
- `use-toast.ts`

Muchos de estos hooks están orientados a notificaciones, conteos, navegación optimizada y datos de cliente/siniestros.

---

## `lib/` – Lógica de dominio y utilidades

Contiene la lógica de negocio, integración con servicios externos y utilidades.

Archivos y carpetas destacadas:

```text
lib/
├─ claims-processor.ts
├─ document-processor.ts
├─ force-update-policies.ts
├─ notifications/
│  └─ claim-notifications.ts
├─ policy-expiration.ts
├─ policy-plans.ts
├─ policy-renewal.ts
├─ react-query-provider.tsx
├─ risk-engine.ts
├─ simple-update-policies.ts
├─ supabase/
│  ├─ client.ts
│  ├─ config.ts
│  ├─ middleware.ts
│  └─ server.ts
├─ supabase.ts
├─ testing/
│  └─ quick-renewal-setup.ts
├─ types/
│  └─ database.ts
├─ utils.ts
└─ validations/
   └─ claim-validations.ts
```

- **Procesos de negocio**: `claims-processor.ts`, `document-processor.ts`, `risk-engine.ts`, `policy-expiration.ts`, `policy-plans.ts`, `simple-update-policies.ts`, `force-update-policies.ts`.
- **Supabase**: configuración del cliente, middleware y helpers (`supabase/` y `supabase.ts`).
- **Notificaciones**: `notifications/claim-notifications.ts`.
- **Validaciones**: `validations/claim-validations.ts`.
- **Tipado**: `types/database.ts` con tipos generados desde la base de datos.
- **Testing / utilidades**: `testing/quick-renewal-setup.ts`, `utils.ts`.

---

## `docs/` – Documentación técnica

Documentación en Markdown de problemas, fixes y guías del sistema (autenticación, performance, flujos de negocio, etc.).

Ejemplos de archivos:

- `API_AUTH_SESSION_FIX.md`
- `AUTO_REFRESH_CONFIRMATION.md`
- `BADGE_DISAPPEAR_SOLUTION.md`
- `BADGE_NOTIFICATION_FIX.md`
- `CLAIMS_LOADING_FIX.md`
- `CLAIMS_ROLE_SEPARATION.md`
- `CLAIMS_SYSTEM_IMPROVEMENTS.md`
- `CLAIM_CUSTOMER_DOCUMENTS_SETUP.md`
- `CLAIM_DOCUMENTS_SYSTEM_GUIDE.md`
- `COOKIE_ISSUES_FINAL_FIX.md`
- `CUSTOMER_DOCUMENTS_IMPROVEMENTS.md`
- `CUSTOMER_DOCUMENTS_SYSTEM.md`
- `CUSTOMER_SELECTOR_FOR_AGENTS.md`
- `DOCUMENT_REQUEST_ERROR_FIX.md`
- `DYNAMIC_CLAIMS_SYNC.md`
- `FIX_COOKIES_AND_HYDRATION.md`
- `FIX_DATABASE_ERROR.md`
- `FIX_SELECT_ITEM_EMPTY_VALUE.md`
- `LOCATION_FIELDS_IMPLEMENTATION.md`
- `LOGIN_ISSUE_FIX.md`
- `LOGIN_PERFORMANCE_OPTIMIZATION.md`
- `LOGOUT_BUTTON_RELOCATION.md`
- `LOGOUT_FUNCTIONALITY.md`
- `LOGOUT_MODAL_WORKING.md`
- `MIGRATION_COUNTRY_FIELD.md`
- `MODALS_OUTSIDE_NAV.md`
- `MODAL_CENTERING_FIX.md`
- `NAVIGATION_PERFORMANCE_OPTIMIZATION.md`
- `OPTIMIZATION_SUMMARY.md`
- `PERFORMANCE_IMPROVEMENTS.md`
- `PERFORMANCE_OPTIMIZATIONS.md`
- `PERFORMANCE_OPTIMIZATION_GUIDE.md`
- `POLICY_CREATION_FIX.md`
- `POLICY_EXPIRATION_SOLUTION.md`
- `PORTAL_SOLUTION.md`
- `QUOTE_COVERAGES_FIX.md`
- `QUOTE_PROCESSING_FIX.md`
- `QUOTE_SYSTEM_IMPLEMENTATION.md`
- `QUOTE_TO_POLICY_PAYMENT_FLOW.md`
- `QUOTE_VEHICLE_SELECTOR.md`
- `REGISTER_FIX.md`
- `RENEWAL_FLOW.md`
- `RE_ENTRY_NOTIFICATION_SYSTEM.md`
- `ROLE_SEPARATION_GUIDE.md`
- `SIMPLIFIED_STATUS_SYSTEM.md`
- `SUPER_AGGRESSIVE_BADGE_FIX.md`
- `TESTING_CUSTOMER_SELECTOR.md`
- `TROUBLESHOOTING_MODAL.md`
- `VEHICLE_DELETE_SWEETALERT.md`
- `VEHICLE_EDIT_SELECT_FIX.md`
- `VEHICLE_FORM_VALIDATION.md`
- `VEHICLE_REGISTRATION_FIX.md`
- `VEHICLE_SCHEMA_FIX.md`

*(Algunos archivos pueden estar vacíos o ser borradores, por ejemplo `ROLE_SEPARATION_SETUP_GUIDE.md`, `TESTING_RENEWAL_GUIDE.md`.)*

---

## `scripts/` – Scripts SQL y utilidades

Scripts para mantenimiento de base de datos, datos de prueba y diagnósticos.

Ejemplos de archivos:

- `create-test-data.ts`
- `diagnose-document-request-error.sql`
- `diagnose-table-structure.sql`
- `disable-problematic-trigger.sql`
- `document-system.sql`
- `fix-notification-titles.sql`
- `fix-status-field-length.sql`
- `insert-expired-policy-browser.js`
- `insert-expired-policy.sql`
- `insert-test-claims.sql`
- `notifications-system.sql`
- `renewal-system.sql`
- `setup-claim-documents-storage.sql`
- `test-claim-documents-setup.sql`
- `update-claims-system.sql`
- `update-user-roles.sql`
- `user-settings-system.sql`

---

## `public/` – Recursos estáticos

Contiene imágenes y otros recursos públicos.

```text
public/
├─ placeholder-logo.png
├─ placeholder-logo.svg
├─ placeholder-user.jpg
├─ placeholder.jpg
├─ placeholder.svg
└─ testing/
   └─ renewal-testing-console.js
```

---

## `styles/` – Estilos globales

```text
styles/
└─ globals.css
```

Hoja de estilos global complementaria o alternativa a la de `app/globals.css`.

---

## `__tests__/` – Pruebas

```text
__tests__/
└─ basic.test.ts
```

Configuración de Jest en `jest.config.json` y `jest.setup.js`.

---

## Archivos SQL y de datos

- `database.sql`: definición principal de la base de datos.
- `seed-data.sql`: datos de ejemplo/iniciales.

---

## Archivos de configuración y metadatos

- **Entorno**: `.env`, `.env.local`, `.env.example`, `.env.local.template`.
- **Next.js / Vercel**: `next.config.mjs`, `vercel.json`, `.vercelignore`.
- **TypeScript**: `tsconfig.json`, `tsconfig.tsbuildinfo`, `next-env.d.ts`.
- **Linter y formateo**: `.eslintrc.json`, `.prettierrc`, `.lintstagedrc.json`.
- **Control de versiones**: `.gitignore`, `.github/`.
- **Jest**: `jest.config.json`, `jest.setup.js`.
- **Otros**: `components.json`, `middleware.ts`, `workflow.json`, `README.md`.

---

## Notas

- Esta estructura se basa en el estado actual del repositorio y puede cambiar con el tiempo.
- Puedes actualizar este archivo manualmente cuando agregues nuevas carpetas o módulos importantes.

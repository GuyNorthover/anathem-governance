# Anathem Web — integration guide for externally built UI (LLM / “vibe coding” workflows)

This document describes how **anathem-web** is structured so another codebase (or an LLM-assisted build) can produce **new pages and workflows** that align with this monorepo and need **minimal refactoring** when merged via pull request.

**Scope:** Frontend monorepo (`apps/*`, `packages/*`). Backend services, database schemas, and **inbound HTTP webhooks** (Stripe, Azure Event Grid, etc.) are **not implemented in this repository**; they live on the API servers this UI calls. This repo does contain patterns for **authenticated REST**, **Next.js API proxy routes**, **streaming/WebSocket transcription**, and **async jobs signaled by HTTP 202** with client-side follow-up.

---

## 1. High-level architecture

| Layer | Responsibility |
|--------|------------------|
| **Next.js apps** (`apps/mental-health`, `apps/police`, `apps/patient-crm-portal`) | App Router (`src/app`), layouts, page-level composition, app-specific hooks and stores |
| **`@anathem/resources`** | **Generated** OpenAPI TypeScript client per app slice (`mental-health`, `police`, `patient-crm-portal`) — **do not hand-edit** |
| **`@anathem/auth`** | Auth0 or Microsoft Entra ID integration, token handling, Next.js `proxy` middleware for `/api/*`, utilities used by API routes |
| **`@anathem/env-constants`** | Centralized `process.env` / build-time feature flags (`NEXT_PUBLIC_*`, server secrets) |
| **Shared UI** (`@anathem/shadcn`, `@anathem/ui`, `@anathem/sidebar`, …) | Design system, primitives, cross-app components |
| **`@anathem/access`** | Role helpers (`makeAuth`), `Guard`, `RoleView` — **not** the source of truth for role enum strings from the API (those come from generated types where used) |

**Package manager:** `pnpm` (workspace). **Task runner:** Turborepo (`turbo`). **Node:** `>=20.9.0`. **React / Next:** versions are pinned via `pnpm-workspace.yaml` `catalog:shared` and root overrides.

---

## 2. Monorepo layout (Turbo + pnpm)

- **Workspace definition:** `pnpm-workspace.yaml` — includes `apps/*` and `packages/*`.
- **Root scripts** (`package.json`): `pnpm dev` → `turbo dev`; `pnpm build` → `turbo build`; `pnpm codegen` / `pnpm codegen:local` → regenerate API clients (via `@anathem/resources` build pipeline).
- **`turbo.json`:** `dev` depends on building `@anathem/resources`, `@anathem/ui`, `@anathem/offline-transcriber` first; `build` uses standard Turbo caching with outputs under `dist/**` and `.next/**`.

**Implication for external builds:** Depend on **workspace package names** (`@anathem/...`) the same way existing apps do. Do not assume npm package versions from public registries for internal packages — they are `workspace:*`.

---

## 3. Applications (which app to mirror)

| App | Package name | Typical use |
|-----|----------------|-------------|
| Mental health clinician product | `@anathem/mental-health` | Richest example: CRM, assessments, consultations, analytics, feature flags |
| Police product | `@anathem/police` | Similar stack; different `@anathem/resources/police` client and routes |
| Patient CRM portal | `@anathem/patient-crm-portal` | Smaller surface; same patterns (auth, proxy, resources) |

**Default reference for new clinical/admin UI:** mirror **`apps/mental-health`** unless the feature is police- or patient-portal–specific.

---

## 4. Next.js App Router conventions

### 4.1 Directory layout (mental-health)

- **`src/app/`** — routes: `page.tsx`, nested `layout.tsx`, route groups as needed.
- **`src/components/`** — feature and page-level React components (not route files).
- **`src/config/`** — e.g. `routes.ts`: **single place for path constants** (`ROUTES`, `PUBLIC_ROUTES`).
- **`src/resources/`** — app-local OpenAPI codegen config (`openapi.config.ts`), **React Query provider** (`query-provider/`), and **hand-written hooks** that wrap generated SDK calls (`hooks/**`).
- **`src/stores/`** — React context providers (`context/*`) and Zustand stores (`zustand/*`).
- **`src/hooks/`** — shared hooks used across features.

### 4.2 Path alias

- **`@/*` → `./src/*`** (see `apps/mental-health/tsconfig.json`).

Use `@/components/...`, `@/config`, `@/resources/hooks/...` in app code.

### 4.3 Root vs. inner layouts

- **`src/app/layout.tsx`** — minimal: font, `globals.css`, wraps children in **`AppLayout`** (`src/components/app-layout/AppLayout.tsx`).
- **`AppLayout`** chooses **guarded** vs **public** shell (e.g. `/error`, `/verify-email`), wires **AuthProvider**, **QueryProvider**, **UserDetailsProvider**, **Radix Theme**, **Toaster**, and **RootLayout** (sidebar + main inset).
- **Feature layouts** (e.g. `src/app/crm/layout.tsx`, `src/app/analytics/layout.tsx`) use **`Guard`** from `@anathem/access/components` with **`makeAuth`** and optional **feature flags** from `@anathem/env-constants`.

**Pattern to copy for a new section:** add a route under `src/app/<segment>/`, optional `layout.tsx` with `Guard` + loading skeleton, and register paths in `src/config/routes.ts`. Add navigation entries in the appropriate **left navigation** module under `src/components/left-navigation/`.

---

## 5. How the UI talks to the backend (REST — not “webhooks”)

There is **no** first-class “webhook” module in this frontend repo. Integration with backends is:

### 5.1 Generated OpenAPI client (`@anathem/resources`)

- **Exports:** `@anathem/resources/mental-health`, `@anathem/resources/police`, `@anathem/resources/patient-crm-portal`.
- **Generated output path:** `packages/resources/src/<app>/generated_endpoints/` (produced by the resources package build script — **never edit by hand**).
- **Regeneration:** Root `pnpm codegen` runs Turbo `codegen`, which builds `@anathem/resources`. The script downloads OpenAPI specs from `OPENAPI_SPEC_URL` in each app’s `.env` (or fallbacks documented in `packages/resources/scripts/download-yaml.mjs`).

**For compatible external code:** call APIs **only** through functions imported from the generated client (same module the app uses), or through thin wrappers in `src/resources/hooks/` that use those functions.

### 5.2 `OpenAPI` base URL and browser requests

In mental-health, **`QueryProvider`** sets:

- `OpenAPI.BASE = API_BASE_URL` where `API_BASE_URL` from `@anathem/env-constants` is **`${APP_BASE_URL}/api/proxy`** — i.e. all generated client calls go to the **Next.js app origin**, path prefix **`/api/proxy`**, not directly to `BACKEND_URL`.

### 5.3 Next.js catch-all proxy

Each app exposes **`src/app/api/proxy/[...url]/route.ts`**:

- Forwards **GET** and mutating verbs (**POST**, **PUT**, **PATCH**, **DELETE**) to **`BACKEND_URL` + path + query**, copying incoming headers via `getHeaders` / `proxyFunction` from `@anathem/auth/utils`.

**Implication:** External prototypes should assume the **same relative API paths** the OpenAPI spec describes, as seen in generated functions (they are written for the backend path shape; the client base URL adds `/api/proxy`).

### 5.4 Auth headers on client-initiated API calls

`OpenAPI.HEADERS` is set to **`appendHeader`** (`@anathem/auth/utils`), which attaches:

`Authorization: Bearer <token>` from **`sessionStorage.getItem('auth_token')`**.

Token lifecycle is tied to **Auth0** or **MSAL (Entra)** depending on build configuration in `@anathem/auth`.

### 5.5 Global response interceptor (mental-health `QueryProvider`)

The shared interceptor handles:

- **401 / 403** → `refreshToken()` (Entra refreshes MSAL token into `sessionStorage`; Auth0 path redirects to login).
- **412** → JSON error; redirect to email verification or `/error` depending on message.
- **202** on specific URL substrings (`clinical-details`, `summaries`, `document-outputs`, `transcripts`) → registers the response URL in **`useConsultationStore`** for **polling / async job UX**.

**If your feature uses long-running backend work:** prefer the same **202 + polling** contract if the backend supports it, or use **React Query** `refetchInterval` on a dedicated query — align with existing consultation/assessment pages that read `pollingRequests` from the consultation store.

### 5.6 “Webhook-like” patterns in this repo (terminology)

| Pattern | Where | Meaning |
|---------|--------|--------|
| **REST + proxy** | `api/proxy`, `@anathem/resources` | Primary server integration |
| **HTTP 202 async** | `QueryProvider` + Zustand | Job accepted; UI tracks URLs to poll |
| **WebSocket streaming** | `@anathem/transcriber` (e.g. Deepgram) | Real-time transcription — not the same as REST webhooks |
| **Service worker messages** | `@anathem/offline-transcriber` | Offline sync — internal browser messaging |

If product language says “webhook,” clarify whether the work is **server-side** (backend repo) or **client polling/subscriptions** (this repo).

---

## 6. Authentication and session

- **`@anathem/auth`** provides **`AuthProvider`**, MSAL/Auth0 wiring, **`proxy`** export used as Next.js middleware (see app’s `src/proxy.ts` with `matcher` for `/api/*` and `/auth/*`).
- **Auth0 middleware** (when not using Entra): attaches **`Authorization`** to responses for API routes, enforces session and email verification (412-style behavior for unverified users on API).
- **Public API paths** (auth package): e.g. `/api/health`, `/api/release`.

**For external builds:** pages that need the logged-in shell should live under the default **`AppLayout`** path; use existing login/callback flows. Do not bypass the proxy for authenticated backend calls unless you intentionally mirror production’s security model (usually you should not).

---

## 7. Roles, permissions, and feature flags

### 7.1 User record

- **`UserDetailsProvider`** (`src/stores/context/user-details/UserDetails.tsx`) loads the current user via **`useGetUserDetails`** (React Query + generated `getUserMeUserMeGet`).
- **`useUserDetails()`** exposes `{ user, isLoading }`. **`user.role`** drives UI branching.

### 7.2 `makeAuth` and case sensitivity

- **`makeAuth(user)`** (`@anathem/access/utils`) normalizes role to **lowercase** and exposes **`auth.is('superadmin')`**, **`auth.in([...])`**, etc.
- Some code compares **PascalCase** API roles directly (e.g. `'SuperAdmin'`, `'Admin'`) in constants or **`RoleView`** maps — **follow the existing file you’re extending**: layout guards often use **lowercase** arrays with `auth.in`, while **`LeftNavigation`** maps **`SuperAdmin` / `Admin` / `Secretary`** to different nav components.

### 7.3 `RoleView` / `AppRoleView`

- **`RoleView`** (`@anathem/access/components`) renders **one of** `views[role]` or fallback.
- **`AppRoleView`** (`src/components/app-role-view/AppRoleView.tsx`) injects **`useUserDetails`**, loading states, and passes **`role={userDetails.role}`**. Mental-health navigation uses **`AppRoleView`** with a **`ROLE_VIEWS`** map.

### 7.4 Route/feature gating with `Guard`

- Example: **`src/app/crm/layout.tsx`** builds `ctx` with `user`, `auth`, `clinician`, and **`flags`** from **`IS_CRM_ENABLED`**, **`IS_CUSTOM_PATHWAYS_ENABLED`** (`@anathem/env-constants`), then **`Guard`** rules redirect or allow.

**For new features gated by config:** add a `NEXT_PUBLIC_*` flag in **`packages/env-constants/src/index.ts`** (following existing naming), use it in layout `Guard` rules, and document the env var for deployment.

---

## 8. UI component placement (what to use in external code)

| Need | Package / location |
|------|---------------------|
| Buttons, inputs, dialogs, tables, etc. | `@anathem/shadcn/components` or specific subpaths from `package.json` `exports` |
| App shell, sidebar inset | `@anathem/sidebar/components` |
| Shared non-shadcn UI, hooks | `@anathem/ui/components`, `@anathem/ui/hooks`, `@anathem/ui/utils` |
| Charts | `@anathem/charts` |
| Forms / dynamic forms | `@anathem/dynamic-form` |
| Styling utilities | `cn` from `@anathem/ui/utils`; Tailwind v4 in apps |
| Icons | e.g. `@heroicons/react`, `lucide-react` (as used in app) |

**Mental-health** wraps the app in **`@radix-ui/themes` `Theme`**. Prefer existing patterns for **spacing**, **max-width containers** (e.g. CRM uses `mx-auto max-w-6xl px-4 py-6`), and **loading skeletons** colocated with the feature.

---

## 9. Data fetching pattern (React Query + hooks)

**Preferred pattern:**

1. Import generated SDK function from `@anathem/resources/<app>`.
2. Wrap in **`src/resources/hooks/<domain>/<name>.ts`** using **`useQuery` / `useMutation`** from `@tanstack/react-query`.
3. Export stable **`queryKey`** constants for cache invalidation.

Example shape (mental-health user hooks): `getUserMeUserMeGet` + `useQuery` with `queryKey: [USER_DETAILS_QUERY_KEY]`.

**Do not** duplicate `fetch` to raw backend URLs for authenticated data if the generated client already covers the endpoint — you would skip `OpenAPI.BASE`, interceptors, and header injection.

---

## 10. Client state (Zustand and context)

- **Cross-page session flows** (consultation/assessment) use **Zustand** in `src/stores/zustand/` (e.g. consultation store for polling URLs, disclosure modal, etc.).
- **User and auth session** use **React context** under `src/stores/context/`.

New isolated feature state can use **local component state** or **Zustand** following nearby features; avoid global state unless multiple routes need it.

---

## 11. Routing checklist (new page / workflow)

1. Add entries to **`src/config/routes.ts`** (`ROUTES`, optionally `ROUTES_NAME`).
2. Add **`src/app/.../page.tsx`** (and **`layout.tsx`** if you need `Guard`, feature flags, or shared chrome).
3. Update **`LeftNavigation`** (or role-specific nav file) so the route is reachable.
4. Add **hooks** under **`src/resources/hooks/`** for new API operations **after** codegen includes those endpoints.
5. If the backend OpenAPI changed: run **`pnpm codegen`** (or merge regenerated `packages/resources` output from CI) — **commit generated files** as the repo does today.

---

## 12. E2E and quality gates

- **Playwright** lives under `apps/mental-health/e2e/` (and similar for other apps). Role-based projects use env-configured users (`e2e/utils/env.ts`, `e2e/README.md`).
- **Pipelines:** `pipelines/e2e/e2e-test.yml` drives CI e2e.

For merge readiness, plan for **accessibility** (`e2e:a11y` where applicable) and **role permissions** specs patterns.

---

## 13. Minimal-refactor checklist for an externally generated feature

When pasting or porting generated code into anathem-web:

- [ ] **App target:** `apps/mental-health` (or police / patient-crm-portal) — correct **`@anathem/resources/<app>`** import path.
- [ ] **API calls:** generated client + **`QueryProvider`** assumptions (base URL `/api/proxy`, interceptors).
- [ ] **Auth:** no hard-coded tokens; rely on **`appendHeader`** / session flows.
- [ ] **Routes:** **`ROUTES` in `src/config/routes.ts`** + App Router file structure.
- [ ] **Roles:** **`makeAuth` + `Guard` + `AppRoleView`** patterns consistent with the file you extend.
- [ ] **Feature flags:** **`@anathem/env-constants`** for `NEXT_PUBLIC_*` toggles.
- [ ] **UI:** **`@anathem/shadcn`**, **`@anathem/ui`**, **`@anathem/sidebar`** instead of ad-hoc component libraries.
- [ ] **Do not edit** `packages/resources/src/*/generated_endpoints/**` by hand — update OpenAPI + codegen.
- [ ] **Dependencies:** add new npm deps only in the **app `package.json`** or the appropriate **shared package** with workspace protocol for internal packages.

---

## 14. Glossary (quick)

| Term | In this repo |
|------|----------------|
| **Workspace package** | `packages/*` imported as `@anathem/<name>` |
| **Codegen** | OpenAPI → TypeScript client in `@anathem/resources` |
| **Proxy** | Next route `/api/proxy/*` → `BACKEND_URL` |
| **Role** | String on user object from API; normalized in `makeAuth` |
| **Guard** | Client layout gate: redirect vs render based on rules |

---

## 15. Suggested prompt snippet for an external LLM

You can append:

> Build a Next.js App Router feature compatible with **anathem-web**: use **pnpm** and **workspace imports** `@anathem/shadcn`, `@anathem/ui`, `@anathem/sidebar`, `@anathem/access`, `@anathem/env-constants`, `@anathem/auth`, `@tanstack/react-query`. Put routes under **`src/app/`**, constants in **`src/config/routes.ts`**, API wrappers in **`src/resources/hooks/`** calling **`@anathem/resources/mental-health`** generated functions only. Assume **`OpenAPI.BASE`** is the app origin **`/api/proxy`** and **`Authorization`** comes from **`sessionStorage`**. Gate routes with **`Guard`** and **`makeAuth`**. Do not implement backend webhooks; use **REST** and, if needed, **202 + polling** like the consultation review flow.

---

*This guide reflects the repository layout and patterns as of the time of writing; when in doubt, locate the closest existing feature in `apps/mental-health` and mirror its structure.*

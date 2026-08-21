# DiFarm — System Documentation

> **Purpose of this file:** Explain the whole DiFarm system so you (or ChatGPT) can write accurate documentation, user guides, and release notes. Prefer this file over guessing from partial context.

**Product:** Multi-farm cattle / livestock management platform (Rwanda)  
**Repo folder:** `difarm-next` (frontend + API + Prisma in one project)  
**Live site (CORS):** `https://difarm.rw`  
**Deploy:** Vercel (app) + Railway PostgreSQL (database)

---

## Table of contents

1. [What DiFarm does](#1-what-difarm-does)
2. [High-level architecture](#2-high-level-architecture)
3. [Tech stack](#3-tech-stack)
4. [Repository layout](#4-repository-layout)
5. [How a request works](#5-how-a-request-works)
6. [Authentication, roles, and permissions](#6-authentication-roles-and-permissions)
7. [Multi-farm scoping](#7-multi-farm-scoping)
8. [Modules and user journeys](#8-modules-and-user-journeys)
9. [Health → Medicine & tools (detailed)](#9-health--medicine--tools-detailed)
10. [Database (Prisma) overview](#10-database-prisma-overview)
11. [API map (`/api/v1`)](#11-api-map-apiv1)
12. [Frontend routes](#12-frontend-routes)
13. [Local development](#13-local-development)
14. [Environment variables](#14-environment-variables)
15. [Deploy (Vercel + Railway)](#15-deploy-vercel--railway)
16. [Progress / feature history (for docs)](#16-progress--feature-history-for-docs)
17. [How to use this README with ChatGPT](#17-how-to-use-this-readme-with-chatgpt)

---

## 1. What DiFarm does

DiFarm helps farm owners, managers, and veterinarians manage day-to-day livestock operations:

| Area | What users can do |
|------|-------------------|
| **Farms & users** | Register farms, assign managers, manage accounts and roles |
| **Cattle** | Register cattle, track status (healthy/sick/sold…), milking/lactation |
| **Production** | Record milk/meat/dung production; record usage and dairy sales |
| **Stock** | Inventory (feed, hygiene, etc.), suppliers, stock movements |
| **Health** | Vaccination, insemination, medicine/tool stock & usage, veterinarians |
| **Waste** | Log dung / liquid manure |
| **Reports** | Production / usage style reports (CSV export where available) |
| **Activity logs** | Audit trail of important actions |
| **Dashboard** | Overview metrics for the selected farm |

It is **multi-tenant by farm**: almost all operational data belongs to a `Farm`.

---

## 2. High-level architecture

```
Browser (Next.js UI)
    │
    │  Axios → same origin /api/v1/...  (or NEXT_PUBLIC_SERVER_URL in split mode)
    ▼
Next.js Pages Router
    │  UI: src/pages/* → src/app/* components
    │  API: src/pages/api/v1/[[...path]].ts
    ▼
Express app (backend/src/createApp.ts)
    │  JWT auth, role checks, Joi validation
    ▼
Services (backend/src/service/*) + Prisma
    ▼
PostgreSQL (Railway in production)
```

**Important design choice:** There is **no separate backend repo** in normal use. The Express API lives in `backend/` and is mounted inside Next.js API routes on Vercel and on `npm run dev`.

Optional local mode: run Express alone on port **4000** (`npm run dev:api`) and Next on **3003** (`npm run dev:web` / `dev:all`).

---

## 3. Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | Next.js 15 (Pages Router), React 18, TypeScript, Tailwind, Redux Toolkit, Axios |
| UI libs | Headless UI, Heroicons, some MUI / Mantine / Ant usage (legacy mix) |
| Backend | Express 4, Passport local + JWT, Joi, Multer, Nodemailer |
| Data | Prisma 5 → PostgreSQL |
| Charts | ApexCharts / Recharts |
| Deploy | Vercel serverless + Railway Postgres |

Config files: `package.json`, `next.config.ts`, `vercel.json`, `prisma/schema.prisma`, `.npmrc` (`legacy-peer-deps=true`).

---

## 4. Repository layout

```
difarm-next/
├── backend/                      # Express API
│   ├── server.ts                 # Standalone listen (DIFARM_STANDALONE_API=1)
│   └── src/
│       ├── createApp.ts          # Express factory
│       ├── router/               # Mounts under /api/v1
│       ├── controller/           # HTTP handlers
│       ├── service/              # Business logic + Prisma
│       ├── middleware/           # Auth, roles, farm scope, validation
│       ├── validation/           # Joi schemas
│       ├── db/prisma.ts          # Prisma client (+ reconnect helper)
│       └── util/                 # farmScope, uploads, responses
├── prisma/
│   ├── schema.prisma             # Source of truth for DB
│   └── seed.ts                   # Demo users + Demo Farm
├── scripts/                      # setup, dev-web, run-api, dev-all
├── src/
│   ├── pages/                    # Next.js routes (+ API routes)
│   ├── app/                      # Screen UI (NOT App Router)
│   │   ├── home/                 # Marketing landing
│   │   ├── auth/, choosefarm/, onboarding/
│   │   └── dashboard/            # Cattle, production, stock, health, medicine…
│   ├── components/               # Layout, Sidebar, tables, RoleGuard
│   ├── hooks/api/                # One hook file per API domain
│   ├── utils/                    # permissions.ts, farmId.ts, postLoginRouting
│   ├── lib/                      # router-compat (React Router → Next)
│   └── store/                    # Redux
├── uploads/                      # Local vaccination docs (ephemeral on Vercel)
├── vercel.json
└── README.md                     # This file
```

**UI pattern:** Thin page in `src/pages/...` imports a screen from `src/app/...` and often wraps it with admin layout (`withAdminLayout` / `DefaultLayout`).

---

## 5. How a request works

### Page load
1. User opens e.g. `/account/health?tab=medicine`.
2. Next serves the page; React mounts Health → Medicine UI.
3. Hook (`useMedicines`) calls `GET /api/v1/medicines/:farmId` with JWT.

### API call (same-origin / production)
1. Axios hits `/api/v1/...`.
2. `src/pages/api/v1/[[...path]].ts` loads Express `createApp()`.
3. Router in `backend/src/router/index.ts` matches path.
4. Middleware: JWT → optional role → farm access → Joi validate.
5. Controller → service → Prisma → JSON response.

### Auth header
Client sends: `Authorization: Bearer <jwt>`.

---

## 6. Authentication, roles, and permissions

### Roles (`Roles` enum in Prisma)

| Role | Meaning |
|------|---------|
| `SUPERADMIN` | Platform admin; all farms; activate farms/accounts |
| `ADMIN` | Farm owner (“Farm Admin”); creates managers; owns farms |
| `MANAGER` | Assigned to farm(s); day-to-day operations |
| `VETERINARIAN` | Cattle + health on assigned farm(s) |

### Identity models
- **Account** — login (username / email / phone), password, role, status  
- **User** — profile linked to Account; owns or manages farms  

### Login / routing after login (`src/utils/postLoginRouting.ts`)
- SUPERADMIN → `/account` (farm optional; can use “all farms”)
- ADMIN with no farm → `/register-farm`
- Others → `/choose-farm`

### Frontend RBAC
File: `src/utils/permissions.ts`  
Helpers: `canCreateEntity`, `canUpdateEntity`, `canDeleteEntity`, `canAccessRoute`  
Layout gate: `src/components/auth/RoleGuard.tsx`

### Typical permission patterns
- **Users / farms create:** SUPERADMIN, ADMIN  
- **Cattle create/update:** SUPERADMIN, ADMIN, MANAGER (vet often view-oriented)  
- **Production / stock / waste:** SUPERADMIN, ADMIN, MANAGER (vet usually excluded)  
- **Health (vaccination, insemination, medicine):** includes VETERINARIAN  
- **Hard deletes:** often SUPERADMIN / ADMIN / MANAGER only  
- **Farm / account activation:** SUPERADMIN  

Always re-check `permissions.ts` and route middlewares before documenting exact rights.

---

## 7. Multi-farm scoping

- Selected farm ID is stored in **localStorage** key `FarmId` (`src/utils/farmId.ts`).
- API list/create calls usually use that farm ID in the path or body.
- Backend: `checkUserFarmExists` + `farmScope` (`backend/src/util/farmScope.ts`).
- SUPERADMIN may use scope `"all"` when no specific farm is selected (`getReadFarmScope()`).
- Inactive farms are blocked for non-superadmins.
- Ownership: `Farm.ownerId`; managers: `FarmManager` (and legacy `managerId`).

---

## 8. Modules and user journeys

### 8.1 Landing & auth
- Public marketing site: `/home` (responsive hero, services, contact).
- Login: `/login` → JWT stored client-side → farm selection / dashboard.

### 8.2 Farms & users
- Register farm, edit farm profile, assign managers.
- Manage users (create accounts, roles). SUPERADMIN activates accounts/farms.

### 8.3 Cattle
- List / search / filter cattle.
- Detail page: status, milking/lactation, related health/production context, PDF-style reports where implemented.
- Statuses include healthy, sick, sold, processed, etc. (see `CattleStatus` enum).

### 8.4 Production
- **Production records** (`/account/production`): daily milk (etc.) by cattle / session (morning/evening).
- **Production usage** (`/account/production_transactions`): sales to dairy, on-farm use, consumption categories.
- **Production totals** (`/account/production_totals`): farm-level totals and pricing by product type.
- Tabs pattern similar to Production ↔ Usage navigation.

### 8.5 Stock (general inventory)
- Separate from Health Medicine.
- Items by `StockType` (food, medication-as-stock-category, hygiene…).
- Suppliers + ADDITION / CONSUME transactions.

### 8.6 Health hub (`/account/health?tab=…`)
| Tab query | Feature |
|-----------|---------|
| `vaccination` | Vaccine records (vaccine name, disease name, optional document upload) |
| `insemination` | Breeding / insemination records |
| `medicine` | Medicine **and** medical tools inventory + usage (see §9) |
| `veterinarian` | Veterinarian contacts / linked accounts |

### 8.7 Waste
- Logs for dung / liquid manure tied to farm.

### 8.8 Reports
- `/account/reports` — reporting UI (production/usage oriented, CSV export).

### 8.9 Activity logs
- `/account/activity-logs` — audit events for accountability.

---

## 9. Health → Medicine & tools (detailed)

Medicine is **under Health**, not under general Stock.

### Concepts
1. **Purchase / stock row (`Medicine`)**  
   - `itemType`: `MEDICINE` (drug) or `TOOL` (e.g. syringe, needle)  
   - Units: `GRAMS` | `LITERS` | `PIECES` (tools often use pieces)  
   - Disease name required for medicines; empty for tools  
   - Tracks remaining `quantity` and purchase `cost` / `purchaseDate`

2. **Usage (`MedicineUsage`)**  
   - Always links to a **medicine** (not a tool) given to cattle  
   - Optional **tool used** (`toolId`) + `toolQuantity`  
   - Decrements medicine stock and, if set, tool stock in one DB transaction  
   - Deleting/updating usage restores stock accordingly  

### UI
- Path: Health → Medicine  
- Sub-tabs via `medicineTab=stock|usage`  
  - **Purchases / stock** — list + batch add purchase (mix medicine and tools)  
  - **Usage** — record treatment; pick medicine; optionally pick tool  

### Key files
- UI: `src/app/dashboard/medicine/`  
- API: `backend/src/router/routes/medicine.routes.ts`  
- Logic: `backend/src/service/medicine.service.ts`  
- Validation: `backend/src/validation/medicine.validation.ts`  

---

## 10. Database (Prisma) overview

Schema file: `prisma/schema.prisma`

| Model | Purpose |
|-------|---------|
| `Account` / `User` | Auth + profile |
| `Farm` / `FarmManager` | Farms and manager assignments |
| `Cattle` / `MilkingPeriod` | Herd + lactation periods |
| `Production` | Production events (qty as float) |
| `ProductionTransaction` | Daily sales / usage of production |
| `ProductionTotals` | Aggregates + unit prices by product type |
| `WastesLog` | Waste production logs |
| `Supplier` / `Stock` / `Transaction` | General inventory |
| `Vaccination` / `Insemination` / `Veterinarian` | Health |
| `Medicine` / `MedicineUsage` | Medical inventory + treatments (+ tools) |
| `ActivityLog` | Audit |

**Enums of note:** `Roles`, `ProductType`, `MedicineItemType`, `MedicineUnit`, `CattleStatus`, `MilkingStatus`, `StockType`.

Sync schema locally / to Railway:

```bash
npm run db:push
```

Seed demo data:

```bash
npm run seed
```

---

## 11. API map (`/api/v1`)

Mounted in `backend/src/router/index.ts`. Most routes require JWT.

| Prefix | Domain |
|--------|--------|
| `/auth` | Login, signup, password reset, activate account, register vet |
| `/users` | Users / team |
| `/farms` | Farms, activate, assign manager |
| `/cattles` | Cattle CRUD + metrics |
| `/productions` | Production records |
| `/production-totals` | Totals / prices |
| `/production-transaction` | Sales & usage (incl. batch) |
| `/waste-logs` | Waste |
| `/stocks` | Stock items |
| `/stock-transactions` | Stock movements |
| `/suppliers` | Suppliers |
| `/vaccinations` | Vaccinations (+ uploads) |
| `/veterinarians` | Vets |
| `/inserminations` | Inseminations (**spelling as in code**) |
| `/medicines` | Medicine/tool stock + usage |
| `/activity-logs` | Activity logs |

**Medicine endpoints (summary):**
- `GET /medicines/:farmId` — list stock  
- `POST /medicines` / `POST /medicines/batch` — purchases  
- `PUT|DELETE /medicines/:medicineId`  
- `GET /medicines/usage/:farmId`  
- `POST /medicines/usage` — record usage (optional tool)  
- `PUT|DELETE /medicines/usage/:usageId`  

Also: `GET /api/health` (Next), uploads via `/uploads/*` → `/api/uploads/*`.

---

## 12. Frontend routes

| Path | Screen |
|------|--------|
| `/` | Redirect → `/home` |
| `/home` | Landing |
| `/login` | Login |
| `/choose-farm` | Pick farm |
| `/register-farm` | Create farm |
| `/account` | Overview |
| `/account/farm-profile` | Farm profile |
| `/account/profile` | User profile |
| `/account/users` | Users |
| `/account/farms` | Farms |
| `/account/cattle` | Cattle |
| `/account/cattle/detail/[cattleId]` | Cattle detail |
| `/account/production` | Production records |
| `/account/production_transactions` | Production usage/sales |
| `/account/production_totals` | Totals |
| `/account/stock` | Stock |
| `/account/stock_transactions` | Stock transactions |
| `/account/health` | Health tabs |
| `/account/reports` | Reports |
| `/account/activity-logs` | Activity logs |
| `/account/waste-logs` | Waste |

Sidebar: `src/components/Admin/Sidebar.tsx`.

---

## 13. Local development

```powershell
cd difarm-next
npm run setup       # install deps + prisma generate (first time)
npm run db:push     # sync schema (stop servers if Prisma EPERM on Windows)
npm run seed        # optional demo users
npm run dev         # Next on :3003 with in-process /api/v1
```

| Script | Meaning |
|--------|---------|
| `npm run dev` / `dev:web` | Next only; API via catch-all (recommended) |
| `npm run dev:api` | Standalone Express on `PORT` (default 4000) |
| `npm run dev:all` | API + web concurrently |
| `npm run build` | `prisma generate && next build` |
| `npm run seed` | Seed users + Demo Farm |

Open **http://localhost:3003**.

**Windows note:** If `prisma generate` fails with `EPERM` on `query_engine-windows.dll.node`, stop `npm run dev`, generate, then restart.

Seed creates local dashboard users (change passwords in production). Do not publish seed credentials on public sites.

---

## 14. Environment variables

There is no committed `.env.example`. Typical variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL URL (required) |
| `JWT_SECRET` | Access tokens / session |
| `JWT_VERIF_SECRET` | Verification / reset tokens |
| `EXPIRE_TIME` | Access JWT TTL (e.g. `7d`) |
| `EXPIRE_VERIF_TIME` | Verif JWT TTL |
| `PORT` | Standalone API port (`4000`) |
| `FRONTEND_URL` | CORS + local port hint |
| `NEXT_PUBLIC_SERVER_URL` | API base for browser (empty = same origin) |
| `CORS_ORIGINS` | Extra allowed origins |
| `ALLOW_SUPER_REGISTER` | Extra superadmin registration |
| `EMAIL` / `EMAIL_USERNAME` / `EMAIL_PASS` | Mailer |
| `VERCEL` | Set automatically on Vercel |

---

## 15. Deploy (Vercel + Railway)

1. Push code to GitHub; Vercel builds with `npm run build` (`prisma generate && next build`).
2. Set Vercel env: `DATABASE_URL`, `JWT_SECRET`, `JWT_VERIF_SECRET`, mailer if needed.
3. Point `DATABASE_URL` at **Railway Postgres**.
4. After schema changes, run `prisma db push` (or migrations) against production DB.
5. ESLint **errors** fail the build (`next.config.ts` does not ignore them). Warnings alone are OK.
6. Uploads on Vercel use `/tmp` — not durable across serverless instances.

`vercel.json` raises timeout/memory for the API catch-all function.

---

## 16. Progress / feature history (for docs)

Use this as a changelog-style narrative when writing “what we built”:

### Platform foundation
- Unified Next.js + Express + Prisma monorepo
- Multi-farm selection, roles (SUPERADMIN / ADMIN / MANAGER / VETERINARIAN)
- Dashboard modules: farms, users, cattle, production, stock, waste, health, activity logs

### Production enhancements
- Float quantities for production
- Production **usage** (ex-sales) with categories and batch APIs
- Managers can edit cattle, production, and usage records
- Production tabs: records vs usage/sales
- Insights / cards on production UI

### Health & veterinary
- Vaccination: “Vaccine Name” + `diseaseName`
- Veterinarian signup: SUPERADMIN allowed; gender not required for vet signup
- Health tabs: Vaccination → Insemination → Medicine → Veterinarian

### Medicine module (major)
- Prisma: `Medicine`, `MedicineUsage`
- Purchase (single + batch), usage against cattle, stock decrement/restore
- Permissions for create/update/delete
- UI under Health → Medicine with **Purchases/stock** and **Usage** sub-tabs
- **Medicine vs Tool** (`itemType`): tools like syringes stocked separately
- Optional **tool used** on a medicine delivery (`toolId`, `toolQuantity`)
- Unit `PIECES` for countable tools

### Reports
- `/account/reports` in sidebar (under Health area in nav)

### UX / quality
- Homepage mobile responsiveness
- Centered medicine purchase modal titles
- Pre-deploy: TypeScript + Next build; fix ESLint errors that fail Vercel

*(Extend this section as you ship more features.)*

---

## 17. How to use this README with ChatGPT

### Recommended prompt pattern

```
I am documenting DiFarm, a multi-farm cattle management system.
Use ONLY the attached SYSTEM / README documentation as source of truth.
Do not invent endpoints, roles, or screens that are not listed.

Task: [e.g. Write a user guide for Health → Medicine including tools]
Audience: [farm manager / veterinarian / developer]
Format: [step-by-step / FAQ / API reference / release notes]
```

### Good documentation tasks to ask for
1. **End-user guide** per module (screenshots placeholders + steps).  
2. **Role matrix** (who can create/edit/delete what).  
3. **Onboarding guide** (register farm → choose farm → add cattle → record production).  
4. **Medicine SOP** (buy medicine + syringe → treat cattle → check remaining stock).  
5. **API reference** from §11.  
6. **Release notes** from §16.  
7. **Deploy checklist** from §15.  

### When ChatGPT should re-check code
If documenting something **new** that is not in §16, point it at concrete paths:
- Permissions: `src/utils/permissions.ts`
- Schema: `prisma/schema.prisma`
- Routes: `backend/src/router/index.ts`
- Sidebar: `src/components/Admin/Sidebar.tsx`

### Accuracy rules for writers / AI
- Prefer farm-scoped language (“for the selected farm”).  
- Distinguish **Stock** (general inventory) vs **Medicine** (health medical stock).  
- Distinguish **Medicine** vs **Tool** inside the medicine module.  
- Keep the insemination API spelling `inserminations` if documenting raw API paths.  
- Do not claim durable file storage on Vercel for uploads.

---

## Quick reference — important source files

| Concern | Path |
|---------|------|
| Schema | `prisma/schema.prisma` |
| Express app | `backend/src/createApp.ts` |
| API mounts | `backend/src/router/index.ts` |
| Next API bridge | `src/pages/api/v1/[[...path]].ts` |
| Permissions | `src/utils/permissions.ts` |
| Farm ID helper | `src/utils/farmId.ts` |
| Sidebar | `src/components/Admin/Sidebar.tsx` |
| Medicine UI | `src/app/dashboard/medicine/` |
| Medicine service | `backend/src/service/medicine.service.ts` |
| Deploy config | `vercel.json`, `next.config.ts` |

---

*Last updated for documentation use after medicine/tool support, reports, production usage, and homepage mobile fixes. Update §16 whenever you ship a meaningful feature.*

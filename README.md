# DiFarm (Next.js + API)

Farm management app — **everything runs from this folder** (`difarm-next`). Do not use a separate `Difarm-Be-main` checkout.

- **Frontend**: Next.js 15 (Pages Router) on port **3003**
- **API**: Express + Prisma in `backend/` on port **4000**
- **Database**: Prisma schema in `prisma/`

## Getting started

```powershell
cd c:\Users\unipod\Downloads\difar\difarm-next
npm run setup      # first time only (installs deps + generates Prisma client)
npm run db:push    # sync database schema (stop dev servers first)
npm run seed       # optional: default login users
npm run dev        # starts API + Next.js together
```

Open **http://localhost:3003** in your browser (not port 4000 — that is the API only).

## Environment

All settings live in `.env` in this folder (database, API, frontend).

```
PORT=4000
FRONTEND_URL=http://localhost:3003
NEXT_PUBLIC_SERVER_URL=http://localhost:4000
DATABASE_URL=postgresql://...
```

## Database seed (default login users)

From this folder:

```bash
npm run seed
```

Seed creates default dashboard users for local setup. Do not publish those credentials on public sites or login screens — change passwords after first login in production.

## Routes (same as original)

| Path | Page |
|------|------|
| `/` | Redirects to `/home` |
| `/home` | Landing page |
| `/login` | Login |
| `/choose-farm` | Farm selection |
| `/account` | Dashboard overview |
| `/account/*` | Farms, users, cattle, production, stock, health, etc. |
| `/stock` | Stock dashboard |
| `/stock/suppliers`, `/stock/items` | Stock modules |

## Project layout

```
difarm-next/
├── backend/          # Express API (runs via npm run dev:api)
├── prisma/           # Database schema + seed
├── scripts/          # dev-all, run-api, setup, etc.
├── src/
│   ├── app/          # Page components
│   ├── components/   # Shared UI components
│   ├── hooks/api/    # API hooks
│   ├── lib/          # router-compat + utilities
│   ├── pages/        # Next.js routes
│   └── store/        # Redux store
└── public/           # Static assets
```

## Scripts

- `npm run dev` — API + Next.js (recommended)
- `npm run dev:web` — Next.js only (port 3003)
- `npm run dev:api` — API only (port 4000)
- `npm run setup` — install all dependencies
- `npm run db:push` / `npm run db:generate` — Prisma
- `npm run seed` — create default dashboard users
- `npm run build` — production build
- `npm run start` — run production build

## Notes

- Uses `--legacy-peer-deps` for some peer dependency mismatches from the original stack.
- Image optimization is disabled (`images.unoptimized`) to keep `<img>` tags working as in the original app.

# CreditFlow — Credit Management Platform

A full-stack SaaS credit management system built with NestJS, React, and PostgreSQL. Users purchase credit packages to unlock and consume AI-powered features, with every transaction recorded atomically and an RBAC guard enforcing both plan-tier and credit-balance checks before granting feature access.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Test Accounts](#test-accounts)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Key Design Decisions](#key-design-decisions)
- [Environment Variables](#environment-variables)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐   ┌───────────┐  │
│  │   React SPA  │───▶│  NestJS API  │──▶│ PostgreSQL│  │
│  │  (Nginx:80)  │    │  (Node:3000) │   │  (5432)   │  │
│  └──────────────┘    └──────────────┘   └───────────┘  │
│       :5173               :3000                          │
└─────────────────────────────────────────────────────────┘
```

**Backend flow for a credit-gated AI request:**

```
Request
  │
  ├─▶ JwtAuthGuard        → validate Bearer token
  │
  ├─▶ RequireFeatureGuard → (1) check user has active plan with feature
  │                         (2) check currentCredits >= feature.creditCost
  │                         (3) $transaction: deduct credits + log CREDIT_OUT
  │
  └─▶ AiController        → execute AI action, return result
```

---

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| Backend     | NestJS 10 · TypeScript · Passport JWT               |
| ORM         | Prisma 5 (type-safe queries, schema migrations)     |
| Database    | PostgreSQL 16                                       |
| Frontend    | React 18 · Vite 5 · TailwindCSS 3 · react-router v6|
| UI Library  | Shadcn/ui · Radix UI · Lucide Icons                 |
| DevOps      | Docker · Docker Compose · Nginx (SPA serving)       |
| API Docs    | Swagger / OpenAPI 3 (auto-generated)                |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+

### One-command setup

```bash
# 1. Clone the repository
git clone https://github.com/nhiney/credit-management-platform.git
cd credit-management-platform

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d
```

Docker Compose will:
1. Start a **PostgreSQL 16** database
2. Build and start the **NestJS backend** — runs `prisma migrate deploy` then `prisma db seed` automatically on first boot
3. Build the **React frontend** with Nginx and serve it as a static SPA

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173         |
| API      | http://localhost:3000/api    |
| Swagger  | http://localhost:3000/api/docs|

### Local development (without Docker)

```bash
# Backend
cd backend
cp .env.example .env          # fill in DATABASE_URL
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev             # http://localhost:3000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

---

## Test Accounts

These accounts are created automatically by the seed script.

| Role  | Email                 | Password    | Credits | Plan       |
|-------|-----------------------|-------------|---------|------------|
| User  | test@example.com      | Test@1234   | 50      | Pro        |
| Admin | admin@example.com     | Admin@1234  | 9999    | —          |

The **Pro** plan unlocks `auto_post` (1 credit) and `generate_image` (3 credits).

---

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:3000/api/docs
```

All protected endpoints require a Bearer JWT token. Use the **Authorize** button in Swagger after calling `POST /api/auth/login`.

### Core endpoints

| Method | Endpoint                  | Auth     | Description                                      |
|--------|---------------------------|----------|--------------------------------------------------|
| POST   | /api/auth/register        | Public   | Create a new account                             |
| POST   | /api/auth/login           | Public   | Login, receive JWT                               |
| GET    | /api/users/me             | JWT      | Profile + active packages + credit balance       |
| GET    | /api/packages             | Public   | List all active packages                         |
| POST   | /api/packages             | Admin    | Create a package                                 |
| PATCH  | /api/packages/:id         | Admin    | Update a package                                 |
| DELETE | /api/packages/:id         | Admin    | Soft-delete a package                            |
| POST   | /api/purchase             | JWT      | Purchase a package (atomic credit credit-in)     |
| GET    | /api/transactions/me      | JWT      | Paginated personal transaction history           |
| GET    | /api/transactions         | Admin    | All transactions (admin view)                    |
| POST   | /api/ai/generate          | JWT+Plan | Generate AI image — costs 3 credits              |
| POST   | /api/ai/auto-post         | JWT+Plan | Auto-schedule post — costs 1 credit              |

---

## Project Structure

```
credit-management-platform/
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma       ← single source of truth for DB schema
│   │   └── seed.ts             ← default packages, features, test users
│   └── src/
│       ├── main.ts             ← bootstrap, Swagger, global pipes
│       ├── app.module.ts       ← root module, global JWT guard
│       ├── prisma/             ← global PrismaService (@Global)
│       ├── common/
│       │   ├── decorators/     ← @CurrentUser, @Public, @Roles, @RequireFeature
│       │   ├── filters/        ← HttpExceptionFilter (standardized errors)
│       │   └── guards/         ← JwtAuthGuard, RolesGuard, RequireFeatureGuard
│       └── modules/
│           ├── auth/           ← register, login, JWT strategy
│           ├── users/          ← profile, admin user list
│           ├── packages/       ← CRUD with soft-delete
│           ├── purchase/       ← atomic purchase with $transaction
│           ├── transactions/   ← paginated history
│           └── ai/             ← credit-gated feature endpoints
│
└── frontend/
    ├── Dockerfile + nginx.conf
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx            ← React root, Toaster
        ├── App.tsx             ← routing, protected routes
        ├── lib/
        │   ├── api.ts          ← axios instance, JWT interceptor, 401 redirect
        │   └── utils.ts        ← cn() helper
        ├── hooks/
        │   └── useAuth.ts      ← login, register, logout, refreshUser
        ├── types/index.ts      ← shared TypeScript interfaces
        ├── components/
        │   └── layout/Navbar.tsx
        └── pages/
            ├── Login.tsx       ← sign in / sign up with demo account hint
            ├── Dashboard.tsx   ← credit balance, active packages, tx history
            └── PackageStore.tsx← package cards with feature list + Buy Now
```

---

## Database Schema

```
users ──────────────────────────────── transactions
  │  (1:N)                    (N:1) ──┘│ (N:1 nullable)
  │                                    │
  └──── user_packages ──── packages ───┘
                                │
                         package_features
                                │
                             features
```

### Entity highlights

| Table            | Purpose                                                        |
|------------------|----------------------------------------------------------------|
| `users`          | Auth + live credit balance (`current_credits`)                |
| `packages`       | Purchasable tiers; soft-deleted with `deleted_at`             |
| `features`       | Named capabilities with per-use `credit_cost`                 |
| `package_features`| M:N junction — which features belong to which package        |
| `user_packages`  | Tracks a user's purchased package; status: ACTIVE/EXPIRED     |
| `transactions`   | Immutable ledger: every debit/credit with `balance_before/after`|

---

## Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| `$transaction` for purchase and credit deduction | Guarantees atomicity — if anything fails, credits and logs both roll back |
| `balance_before` / `balance_after` on every transaction | Full audit trail; balance can be reconstructed at any point in time |
| `referenceId` (unique) on transactions | Idempotency — duplicate purchase requests (network retries) are safely rejected |
| `deletedAt` soft-delete on packages | Packages with active users can't be hard-deleted without breaking referential integrity |
| `creditCost` on features (not hardcoded in guards) | Different features can carry different costs, configurable without code changes |
| `@Global()` PrismaModule | Single connection pool across all modules without re-importing |
| Global `JwtAuthGuard` via `APP_GUARD` | Every route is protected by default; use `@Public()` to explicitly opt out |
| `user_packages` tracks purchased tiers | Enables the RBAC guard to ask "does this user's active plan include feature X?" |
| `Decimal(10,2)` for price | Floating-point arithmetic is never safe for monetary values |

---

## Environment Variables

| Variable          | Default                            | Description                      |
|-------------------|------------------------------------|----------------------------------|
| `POSTGRES_USER`   | `credit_user`                      | PostgreSQL username               |
| `POSTGRES_PASSWORD` | `credit_pass`                    | PostgreSQL password               |
| `POSTGRES_DB`     | `credit_db`                        | Database name                     |
| `JWT_SECRET`      | *(change in production)*           | Secret for signing JWT tokens     |
| `JWT_EXPIRES_IN`  | `7d`                               | Token expiry duration             |
| `NODE_ENV`        | `production`                       | Node environment                  |
| `VITE_API_URL`    | `http://localhost:3000`            | Backend URL used by the frontend  |

---

## Author

**Nhi** — nhiyen.engineer@gmail.com

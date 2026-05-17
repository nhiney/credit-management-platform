# CreditFlow — Credit Management Platform

An enterprise-grade SaaS credit management system built with Clean Architecture, SOLID principles, and production-ready infrastructure. Users purchase credit packages to unlock and consume AI-powered features, with every transaction recorded atomically and a feature guard enforcing both plan-tier and credit-balance checks before granting access.

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

The backend follows **Clean Architecture** with strict layer separation:

```
Presentation  →  controllers, guards, interceptors, filters
Application   →  services, use-cases
Domain        →  entities, value objects, interfaces, factories, strategies
Infrastructure → repositories (Prisma), loggers (Winston), strategies
```

Design patterns applied:
- **Repository Pattern** — `IUserRepository`, `IPackageRepository`, `ITransactionRepository` with Symbol-based DI tokens; all services depend on interfaces, not Prisma directly
- **Factory Pattern** — `TransactionFactory.build()` is the single source for creating ledger entries (computes `balanceBefore`/`balanceAfter`, generates idempotent `referenceId`)
- **Strategy Pattern** — `ICreditDeductionStrategy` / `PrepaidDeductionStrategy` decouples the deduction algorithm from the guard

**Credit-gated request flow:**

```
Request
  │
  ├─▶ CorrelationIdMiddleware → attach UUID to req + X-Correlation-ID header
  ├─▶ JwtAuthGuard           → validate Bearer token
  ├─▶ RequireFeatureGuard    → check plan tier + credits → atomic deduction
  └─▶ AiController           → execute AI action, return result
```

C4 architecture diagrams are in [`docs/`](./docs/) (PlantUML — Context, Container, Component, Sequence).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 10, TypeScript, Passport JWT |
| ORM | Prisma 5 (type-safe queries, schema migrations) |
| Database | PostgreSQL 16 |
| Frontend | React 18, Vite 5, TailwindCSS 3, react-router v6 |
| Logging | Winston (structured JSON in prod, colorized in dev) |
| Testing | Jest + ts-jest — 53 unit tests, mocked repositories |
| Git Hooks | Husky v9, lint-staged (ESLint + Prettier), commitlint |
| DevOps | Docker Compose, multi-stage builds, Nginx (SPA) |
| API Docs | Swagger / OpenAPI 3 (auto-generated) |

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
├── docs/                       ← C4 PlantUML diagrams
│
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma       ← single source of truth for DB schema
│   │   └── seed.ts             ← default packages, features, test users
│   └── src/
│       ├── main.ts             ← bootstrap, Winston logger, Swagger, global pipes
│       ├── app.module.ts       ← root module, global JWT + Throttler guards
│       ├── prisma/             ← @Global() PrismaService
│       ├── domain/
│       │   ├── entities/       ← UserEntity, PackageEntity, FeatureEntity, TransactionEntity
│       │   ├── value-objects/  ← CreditAmount (immutable), Email (normalized)
│       │   ├── exceptions/     ← InsufficientCreditsException, InvalidPackageException
│       │   ├── factories/      ← TransactionFactory.build() — audit trail
│       │   ├── interfaces/     ← IUserRepository, IPackageRepository, ITransactionRepository
│       │   └── strategies/     ← ICreditDeductionStrategy interface
│       ├── infrastructure/
│       │   ├── database/
│       │   │   ├── repositories/ ← Prisma implementations of repo interfaces
│       │   │   └── strategies/   ← PrepaidDeductionStrategy
│       │   └── logger/         ← Winston options (dev: colorized, prod: JSON)
│       ├── common/
│       │   ├── constants/      ← INJECTION_TOKENS (Symbol-based DI)
│       │   ├── decorators/     ← @CurrentUser, @Public, @Roles, @RequireFeature
│       │   ├── filters/        ← HttpExceptionFilter (standardized error envelope)
│       │   ├── guards/         ← JwtAuthGuard, RolesGuard, RequireFeatureGuard
│       │   ├── interceptors/   ← LoggingInterceptor (method, URL, duration, correlationId)
│       │   └── middlewares/    ← CorrelationIdMiddleware (UUID v4 per request)
│       ├── modules/
│       │   ├── auth/           ← register, login, JWT strategy
│       │   ├── users/          ← profile, admin user list (paginated)
│       │   ├── packages/       ← CRUD with soft-delete via IPackageRepository
│       │   ├── purchase/       ← atomic purchase with $transaction
│       │   ├── transactions/   ← paginated history via ITransactionRepository
│       │   └── ai/             ← credit-gated feature endpoints + PrepaidDeductionStrategy
│       └── __tests__/          ← 53 unit tests (no DB required)
│
└── frontend/
    ├── Dockerfile + nginx.conf
    └── src/
        ├── lib/api.ts          ← axios + JWT interceptor + 401 redirect
        ├── hooks/useAuth.ts    ← login, register, logout, refreshUser
        ├── types/index.ts      ← shared TypeScript interfaces
        └── pages/
            ├── Login.tsx       ← sign in / sign up
            ├── Dashboard.tsx   ← credit balance, packages, paginated tx history
            └── PackageStore.tsx← package cards with feature list + purchase flow
```

### Testing

```bash
cd backend

# Run all 53 unit tests (no database needed)
npm run test:unit

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Tests cover: `TransactionFactory`, `AuthService`, `PurchaseService`, `RequireFeatureGuard`, `CreditAmount` value object, `UserEntity` domain entity.

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

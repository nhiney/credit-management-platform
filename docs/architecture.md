# Architecture Specification

## Clean Architecture Layer Map

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                         │
│   Controllers · Guards · Filters · Interceptors · Middleware │
│   (HTTP boundary — no business logic here)                   │
├──────────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                           │
│   Services (Use Cases) — orchestrate domain objects          │
│   DTOs — data transfer between layers                        │
├──────────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER                              │
│   Entities · Repository Interfaces · Factories · Strategies  │
│   (Zero external dependencies — pure TypeScript)             │
├──────────────────────────────────────────────────────────────┤
│                 INFRASTRUCTURE LAYER                          │
│   Prisma Repositories · WinstonLogger · PrismaService        │
│   (Concrete implementations of domain interfaces)            │
└──────────────────────────────────────────────────────────────┘
```

## Backend Folder Structure (Clean Architecture)

```
backend/src/
│
├── domain/                          ← DOMAIN LAYER (no framework deps)
│   ├── entities/
│   │   ├── user.entity.ts           ← Pure domain object: User
│   │   ├── package.entity.ts
│   │   └── transaction.entity.ts
│   ├── interfaces/
│   │   ├── user.repository.interface.ts        ← IUserRepository
│   │   ├── package.repository.interface.ts     ← IPackageRepository
│   │   └── transaction.repository.interface.ts ← ITransactionRepository
│   ├── factories/
│   │   └── transaction.factory.ts   ← TransactionFactory (Factory Pattern)
│   └── strategies/
│       └── credit-deduction.strategy.ts ← ICreditDeductionStrategy (Strategy Pattern)
│
├── infrastructure/                  ← INFRASTRUCTURE LAYER
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts     ← @Global() module
│   │   │   └── prisma.service.ts    ← extends PrismaClient
│   │   └── repositories/
│   │       ├── user.repository.ts   ← implements IUserRepository
│   │       ├── package.repository.ts
│   │       └── transaction.repository.ts
│   └── logger/
│       └── winston.logger.ts        ← WinstonLogger implementation
│
├── common/                          ← CROSS-CUTTING CONCERNS
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   ├── require-feature.decorator.ts
│   │   └── roles.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts ← Standardized error envelope
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        ← Global JWT guard
│   │   ├── require-feature.guard.ts ← RBAC + credit deduction
│   │   └── roles.guard.ts           ← Admin role check
│   ├── interceptors/
│   │   └── logging.interceptor.ts   ← Request/response logging
│   ├── middlewares/
│   │   └── correlation-id.middleware.ts ← X-Correlation-ID injection
│   └── constants/
│       └── injection-tokens.ts      ← DI tokens for repository interfaces
│
└── modules/                         ← APPLICATION LAYER (NestJS modules)
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.service.ts
    │   ├── auth.controller.ts
    │   ├── dto/
    │   │   ├── register.dto.ts
    │   │   └── login.dto.ts
    │   └── strategies/
    │       └── jwt.strategy.ts
    ├── users/
    │   ├── users.module.ts
    │   ├── users.service.ts
    │   └── users.controller.ts
    ├── packages/
    │   ├── packages.module.ts
    │   ├── packages.service.ts
    │   ├── packages.controller.ts
    │   └── dto/
    ├── purchase/
    │   ├── purchase.module.ts
    │   ├── purchase.service.ts
    │   └── purchase.controller.ts
    ├── transactions/
    │   ├── transactions.module.ts
    │   ├── transactions.service.ts
    │   └── transactions.controller.ts
    └── ai/
        ├── ai.module.ts
        ├── ai.service.ts
        ├── ai.controller.ts
        └── dto/
```

## Design Patterns Applied

### 1. Repository Pattern
**Problem:** Services directly coupled to Prisma — hard to test, hard to swap ORM.  
**Solution:** Each aggregate root has an interface (`IUserRepository`) in the domain layer and a concrete implementation (`UserRepository`) in the infrastructure layer. Services depend on the interface (injected via DI token), not the implementation.

```typescript
// domain/interfaces/user.repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  incrementCredits(id: string, amount: number, tx?: PrismaTransactionClient): Promise<User>;
  // ...
}

// modules/auth/auth.service.ts
constructor(
  @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
) {}
```

**Testing benefit:** Mock `IUserRepository` with `jest.fn()` — no database needed.

### 2. Factory Pattern
**Problem:** Creating a `Transaction` record requires computing `balanceBefore`, `balanceAfter`, and a deterministic `referenceId`. This logic is duplicated across `PurchaseService` and `RequireFeatureGuard`.  
**Solution:** `TransactionFactory.build()` centralizes all construction logic.

```typescript
// domain/factories/transaction.factory.ts
class TransactionFactory {
  static build(params: BuildTransactionParams): TransactionCreateInput {
    return {
      ...params,
      balanceBefore: params.currentBalance,
      balanceAfter: params.type === CREDIT_IN
        ? params.currentBalance + params.amount
        : params.currentBalance - params.amount,
      referenceId: `${params.type}-${params.userId}-${params.contextId}-${Date.now()}`,
    };
  }
}
```

### 3. Strategy Pattern
**Problem:** The credit-deduction algorithm (deduct → validate → log) must be testable in isolation and swappable (e.g., PostpaidStrategy, FreeTrialStrategy for different business models).  
**Solution:** `ICreditDeductionStrategy` interface with `PrepaidDeductionStrategy` as the default implementation. `RequireFeatureGuard` depends on the interface.

```typescript
// domain/strategies/credit-deduction.strategy.ts
export interface ICreditDeductionStrategy {
  execute(
    userId: string,
    feature: Feature,
    tx: PrismaTransactionClient,
  ): Promise<{ updatedUser: User; transaction: Transaction }>;
}
```

## Security Architecture

| Layer | Control | Implementation |
|-------|---------|----------------|
| Transport | HTTPS enforcement | Nginx TLS termination |
| Headers | XSS, clickjacking, MIME | `helmet()` global middleware |
| CORS | Origin whitelist | `cors({ origin: FRONTEND_URL })` |
| Rate Limiting | 100 req/min per IP | `@nestjs/throttler` |
| Auth | Stateless JWT | `passport-jwt`, 7d expiry |
| Authorization | Role-based | `RolesGuard` + `@Roles()` |
| Feature Access | Plan + Credit | `RequireFeatureGuard` |
| Input | Type validation | `class-validator` + `ValidationPipe` |
| SQL Injection | ORM parametrization | Prisma prepared statements (never raw) |

## Observability Architecture

```
HTTP Request
    │
    ▼
CorrelationIdMiddleware
    │ → generates uuid, attaches to req + AsyncLocalStorage
    │
    ▼
LoggingInterceptor (before)
    │ → { correlationId, method, path, body (sanitized) }
    │
    ▼
[Business Logic — Services log key events with correlationId]
    │
    ▼
LoggingInterceptor (after)
    │ → { correlationId, statusCode, duration_ms }
    │
    ▼ (on error)
HttpExceptionFilter
    │ → { correlationId, error, stack (non-prod) }

All logs → WinstonLogger → JSON format
  Dev:  Console (colorized)
  Prod: Console (JSON) + combined.log + error.log
```

## Git Branching Strategy

```
main
 └── feature/docs-architecture       ← Step 1 (current)
 └── feature/project-setup           ← Step 2
 └── feature/database-schema         ← Step 3
 └── feature/core-backend-logic      ← Step 4
 └── feature/frontend-docker         ← Step 5
```

Each feature branch is squash-merged into `main` after review.

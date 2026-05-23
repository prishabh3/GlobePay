# GlobePay — Production-Grade Fintech Microservices Platform

A full-stack, event-driven fintech platform built with Spring Boot 3.2, Kafka, Redis, PostgreSQL, and Next.js 15.

---

## Architecture

```
                          ┌─────────────────────────────────────────────────────┐
                          │                   Next.js 15 Frontend               │
                          │  login · register · dashboard · transfer · kyc       │
                          │  transactions · cards · admin                        │
                          └───────────────────────┬─────────────────────────────┘
                                                  │ HTTP
                                                  ▼
                          ┌─────────────────────────────────────────────────────┐
                          │              API Gateway  :8080                     │
                          │  Spring Cloud Gateway · JWT validation filter        │
                          │  Sets X-User-Id / X-User-Email headers downstream   │
                          └────────┬──────────┬──────────┬──────────┬───────────┘
                                   │          │          │          │
              ┌────────────────────┘          │          │          └─────────────────────┐
              ▼                               ▼          ▼                                ▼
  ┌──────────────────┐          ┌─────────────────┐  ┌──────────────────┐   ┌────────────────────┐
  │  auth-service    │          │  user-service   │  │  wallet-service  │   │ transaction-service│
  │  :8081           │          │  :8082          │  │  :8083           │   │  :8084             │
  │  JWT · BCrypt    │          │  KYC · profiles │  │  multi-currency  │   │  transfers · refund│
  └──────────────────┘          └────────┬────────┘  │  Redis locks     │   │  idempotency cache │
                                         │           └────────┬─────────┘   └─────────┬──────────┘
                                         │                    │                        │
                                ─────────┴────────────────────┴────────────────────────┴─────────
                                                    Kafka Topics
                                   user-registered · kyc-approved · money-transferred · card-issued
                                ─────────┬────────────────────┬────────────────────────┬─────────
                                         │                    │                        │
              ┌──────────────────────────▼───┐  ┌────────────▼──────────┐  ┌──────────▼──────────┐
              │  credit-scoring-service :8085 │  │  card-service  :8086  │  │ notification-service│
              │  ML-style scoring · limits    │  │  virtual cards · CVV  │  │  :8088  e-mail      │
              └───────────────────────────────┘  └───────────────────────┘  └─────────────────────┘

              ┌─────────────────────────────────┐
              │  bank-integration-service  :8087 │
              │  Circuit breaker · Retry          │
              │  Loan approval simulation         │
              └─────────────────────────────────┘
```

---

## Services

| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 8080 | JWT validation, request routing |
| auth-service | 8081 | Registration, login, token refresh |
| user-service | 8082 | User profiles, KYC document management |
| wallet-service | 8083 | Multi-currency wallets, currency conversion |
| transaction-service | 8084 | P2P transfers, refunds, transaction history |
| credit-scoring-service | 8085 | Income/employment based credit scoring |
| card-service | 8086 | Virtual card issuance, freeze/unfreeze |
| bank-integration-service | 8087 | External bank simulation with resilience patterns |
| notification-service | 8088 | Email notifications via Kafka events |

---

## Kafka Event Flow

```
User registers
  └─► user-registered
        ├─► user-service       creates UserProfile
        └─► notification-service  sends welcome email

Admin approves KYC
  └─► kyc-approved
        ├─► wallet-service     provisions USD + INR wallets
        ├─► credit-scoring-service  initialises credit profile
        └─► notification-service  sends approval email

Transfer completes
  └─► money-transferred
        └─► notification-service  emails sender + recipient

Card issued
  └─► card-issued
        └─► notification-service  emails card details
```

---

## Security Model

Every service is **stateless** (no sessions). The API Gateway validates the JWT, then injects:
- `X-User-Id` — extracted from the token subject
- `X-User-Email` — extracted from a custom claim

Downstream services read these headers via `GatewayAuthFilter` and populate the Spring `SecurityContext`. Services never re-validate the JWT — only the gateway does.

---

## Key Reliability Patterns

| Pattern | Where used |
|---|---|
| Distributed locking (Redisson) | wallet-service debit/credit operations |
| Optimistic locking (`@Version`) | Wallet entity — prevents lost updates |
| Idempotency keys (Redis + DB) | transaction-service — 24 h TTL prevents duplicate transfers |
| Circuit breaker + Retry (Resilience4j) | bank-integration-service external calls |
| Kafka at-least-once delivery | all event producers |
| Soft delete (`is_deleted` flag) | all JPA entities via shared `AuditEntity` |

---

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Java 21+ (for local development)
- Node.js 18+ (for frontend)

### 1. Start all infrastructure and services

```bash
cd docker
docker compose up --build
```

This starts PostgreSQL (one instance per service), Kafka, Redis, Zookeeper, and all 9 Spring Boot services.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

### 3. Register and explore

1. Register at `/register`
2. Log in at `/login`
3. Go to `/kyc` — upload a document (enter any URL, e.g. `https://example.com/doc.pdf`)
4. An admin must approve KYC at `/admin` (log in as a user with `ROLE_ADMIN`)
5. After KYC approval, wallets are auto-provisioned — check `/dashboard`
6. Send money at `/transfer` using wallet IDs from the dashboard
7. Issue virtual cards at `/cards`
8. View transaction history at `/transactions`

---

## Database Layout

Each service has its own PostgreSQL instance (ports 5433–5439). There is no shared schema.

| Service | Port | Database |
|---|---|---|
| auth-service | 5433 | postgres-auth |
| user-service | 5434 | postgres-user |
| wallet-service | 5435 | postgres-wallet |
| transaction-service | 5436 | postgres-tx |
| credit-scoring-service | 5437 | postgres-credit |
| card-service | 5438 | postgres-card |
| notification-service | 5439 | postgres-notification |

---

## API Reference

All requests go through the gateway at `http://localhost:8080`.

### Auth

| Method | Path | Auth |
|---|---|---|
| POST | `/api/v1/auth/register` | — |
| POST | `/api/v1/auth/login` | — |
| POST | `/api/v1/auth/refresh` | — |
| GET | `/api/v1/auth/me` | Bearer |

### Users / KYC

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/users/profile` | Get own profile |
| POST | `/api/v1/users/kyc/documents` | Upload KYC document |
| GET | `/api/v1/users/kyc/status` | Get KYC status + documents |
| POST | `/api/v1/users/admin/kyc/{userId}/review` | Approve/reject KYC (admin) |
| GET | `/api/v1/users/admin/users` | List all users (admin) |

### Wallets

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/wallets` | Create wallet |
| GET | `/api/v1/wallets` | List my wallets |
| POST | `/api/v1/wallets/convert` | Currency conversion |

### Transactions

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/transactions/transfer` | Transfer funds |
| GET | `/api/v1/transactions/history` | Paginated history |
| GET | `/api/v1/transactions/{id}` | Single transaction |
| POST | `/api/v1/transactions/{id}/refund` | Refund (admin) |

### Cards

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/cards` | Issue virtual card |
| GET | `/api/v1/cards` | List my cards |
| POST | `/api/v1/cards/{id}/freeze` | Freeze card |
| POST | `/api/v1/cards/{id}/unfreeze` | Unfreeze card |

### Credit Scoring

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/credit/assess` | Run credit assessment |
| GET | `/api/v1/credit/score` | Get credit score |

### Bank Integration

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/bank/verify-account` | Verify bank account |
| POST | `/api/v1/bank/loan/apply` | Apply for loan |

---

## Credit Scoring Algorithm

Scoring is deterministic and transparent:

| Factor | Points |
|---|---|
| Base | 300 |
| Employment: EMPLOYED | +200 |
| Employment: SELF_EMPLOYED | +150 |
| Employment: RETIRED | +120 |
| Employment: STUDENT | +100 |
| Employment: UNEMPLOYED | +30 |
| Annual income ≥ $100k | +200 |
| Annual income ≥ $50k | +150 |
| Annual income ≥ $25k | +100 |
| Annual income ≥ $10k | +60 |
| Education: PhD | +150 |
| Education: Masters | +120 |
| Education: Bachelors | +90 |
| Visa: Permanent/Citizen | +100 |
| Visa: Work/H1B | +80 |
| Visa: Student/F-1 | +50 |
| University provided | +50 |
| **Maximum** | **900** |

Risk tiers: LOW (≥750) · MEDIUM (≥600) · HIGH (≥450) · VERY_HIGH (<450)

Credit limit = annual income × multiplier (LOW: 50%, MEDIUM: 30%, HIGH: 15%, VERY_HIGH: 5%)

---

## Running Tests

```bash
cd backend
# Run tests for the three core services
mvn clean test -pl shared,wallet-service,transaction-service,credit-scoring-service -am
```

28 unit tests cover:
- `WalletServiceTest` — debit/credit balance logic, locking, insufficient funds (10 tests)
- `TransactionServiceTest` — transfer, Redis/DB idempotency, failure handling, refund (9 tests)
- `CreditScoringServiceTest` — score boundaries, risk tiers, credit limits (9 tests)

---

## Project Structure

```
GlobePay/
├── backend/
│   ├── pom.xml                     # Multi-module Maven parent
│   ├── shared/                     # Shared library: events, exceptions, API response wrappers
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── wallet-service/
│   ├── transaction-service/
│   ├── credit-scoring-service/
│   ├── card-service/
│   ├── bank-integration-service/
│   └── notification-service/
├── frontend/                       # Next.js 15 App Router
│   ├── app/                        # Pages: dashboard, transfer, kyc, cards, admin …
│   ├── components/                 # Navbar, Card, Badge, LoadingSpinner
│   ├── services/                   # Axios service wrappers per domain
│   ├── lib/                        # auth.ts (JWT decode), api.ts (Axios instance)
│   └── types/                      # TypeScript interfaces
└── docker/
    └── docker-compose.yml          # All services + infrastructure
```

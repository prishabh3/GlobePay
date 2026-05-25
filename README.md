# GlobePay — Cross-Border Fintech Platform

A full-stack, production-grade fintech platform built with **Spring Boot 3**, **Apache Kafka**, **Redis**, **PostgreSQL**, and **Next.js 16**. It demonstrates real-world microservices patterns: event-driven architecture, distributed locking, idempotency, JWT-based auth, KYC document verification, virtual card issuance, and credit scoring.

---

## Table of Contents

1. [How it Works](#how-it-works)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Services at a Glance](#services-at-a-glance)
5. [Kafka Event Flow](#kafka-event-flow)
6. [Security Model](#security-model)
7. [Reliability Patterns](#reliability-patterns)
8. [Quick Start](#quick-start)
9. [User Journey](#user-journey)
10. [API Reference](#api-reference)
11. [Database Layout](#database-layout)
12. [Credit Scoring Algorithm](#credit-scoring-algorithm)
13. [Running Tests](#running-tests)
14. [Project Structure](#project-structure)
15. [Common Issues](#common-issues)

---

## How it Works

GlobePay lets users register, verify their identity (KYC), hold multi-currency wallets, send money to other users, issue virtual debit cards, and get a credit score — all behind a single API gateway.

The backend is split into **9 independent microservices**. They never call each other directly. Instead they communicate through **Kafka topics**: when one service completes an action (e.g. KYC approved), it publishes an event, and every service that cares about it reacts independently. This means the system stays responsive even if one service is slow or temporarily down.

The frontend is a Next.js app that talks exclusively to the API Gateway on port 8080. The gateway validates every JWT and injects the user's identity as headers before forwarding the request to the right service.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, SWR, Axios, Recharts |
| API Gateway | Spring Cloud Gateway 4, JWT filter, CORS |
| Microservices | Spring Boot 3.2, Spring Security, Spring Data JPA |
| Messaging | Apache Kafka, Zookeeper |
| Caching / Locking | Redis, Redisson (distributed locks) |
| Database | PostgreSQL (one instance per service) |
| Resilience | Resilience4j (circuit breaker + retry) |
| Auth | JWT (JJWT), BCrypt password hashing |
| Build | Maven multi-module (parent pom) |
| Infrastructure | Docker, Docker Compose |

---

## Architecture

```
                     ┌───────────────────────────────────────────────────────┐
                     │                Next.js 16 Frontend                    │
                     │  login · register · dashboard · transfer · kyc        │
                     │  transactions · cards · admin                         │
                     └─────────────────────────┬─────────────────────────────┘
                                               │ HTTPS / REST
                                               ▼
                     ┌───────────────────────────────────────────────────────┐
                     │              API Gateway  :8080                       │
                     │  Spring Cloud Gateway · JWT validation filter          │
                     │  Injects X-User-Id and X-User-Email headers           │
                     └──────┬──────────┬──────────┬──────────┬──────────────┘
                            │          │          │          │
         ┌──────────────────┘          │          │          └──────────────────────┐
         ▼                             ▼          ▼                                 ▼
┌─────────────────┐      ┌─────────────────┐  ┌──────────────────┐   ┌────────────────────┐
│  auth-service   │      │  user-service   │  │  wallet-service  │   │ transaction-service│
│  :8081          │      │  :8082          │  │  :8083           │   │  :8084             │
│  JWT · BCrypt   │      │  KYC · profiles │  │  multi-currency  │   │  transfers · refund│
│  token refresh  │      │  file uploads   │  │  Redis locks     │   │  idempotency cache │
└─────────────────┘      └────────┬────────┘  └────────┬─────────┘   └──────────┬─────────┘
                                  │                    │                         │
                    ──────────────┴────────────────────┴─────────────────────────┴──────────
                                                Kafka Topics
                          user-registered · kyc-approved · money-transferred · card-issued
                    ──────────────┬────────────────────┬─────────────────────────┬──────────
                                  │                    │                         │
         ┌────────────────────────▼──┐  ┌─────────────▼──────────┐  ┌───────────▼──────────┐
         │ credit-scoring-service    │  │  card-service  :8086   │  │ notification-service  │
         │ :8085 score · risk · limit│  │  virtual cards · freeze│  │ :8088  email alerts   │
         └───────────────────────────┘  └────────────────────────┘  └───────────────────────┘

         ┌───────────────────────────────────┐
         │  bank-integration-service  :8087  │
         │  Circuit breaker · Retry           │
         │  Loan approval simulation          │
         └───────────────────────────────────┘
```

---

## Services at a Glance

| Service | Port | What it does |
|---|---|---|
| **api-gateway** | 8080 | Single entry point. Validates JWT, routes requests, injects user identity headers |
| **auth-service** | 8081 | User registration, login, JWT issuance, token refresh |
| **user-service** | 8082 | User profiles, KYC document upload and review, admin user management |
| **wallet-service** | 8083 | Multi-currency wallets, balance operations with distributed locks, currency conversion |
| **transaction-service** | 8084 | P2P money transfers with idempotency, transaction history, refunds |
| **credit-scoring-service** | 8085 | Income and employment-based credit scoring, risk classification, credit limits |
| **card-service** | 8086 | Virtual debit card issuance, freeze, unfreeze, and cancellation |
| **bank-integration-service** | 8087 | Simulated external bank calls with circuit breaker and retry |
| **notification-service** | 8088 | Listens to Kafka events and sends email notifications |

---

## Kafka Event Flow

Services are **completely decoupled**. When something important happens, a service publishes an event and moves on. Other services react to it independently.

```
User registers
  └─► Publishes:  user-registered
        ├─► user-service          creates UserProfile row
        └─► notification-service  sends welcome email

Admin approves KYC
  └─► Publishes:  kyc-approved
        ├─► wallet-service           auto-provisions USD + INR wallets
        ├─► credit-scoring-service   initialises credit profile
        └─► notification-service     sends approval email to user

Transfer completes
  └─► Publishes:  money-transferred
        └─► notification-service  emails both sender and recipient

Card issued
  └─► Publishes:  card-issued
        └─► notification-service  emails card details to user
```

> **Why Kafka?** If `notification-service` is down during registration, it will pick up the `user-registered` event as soon as it comes back online — no message is lost. This is the key advantage of event-driven design over direct REST calls between services.

---

## Security Model

The platform uses **stateless JWT authentication** — no sessions, no cookies.

### How it works step by step

1. User logs in via `auth-service`, receives an `accessToken` (15 min) and `refreshToken` (7 days)
2. Every subsequent request carries `Authorization: Bearer <accessToken>`
3. The **API Gateway** intercepts every request, validates the JWT signature and expiry
4. If valid, the gateway extracts the user's identity and injects two headers before forwarding:
   - `X-User-Id` — the user's UUID (from the JWT `sub` claim)
   - `X-User-Email` — the user's email (from a custom JWT claim)
5. Downstream services **never validate the JWT themselves** — they simply read `X-User-Id` and trust the gateway
6. When the `accessToken` expires, the frontend automatically calls `/auth/refresh` using the `refreshToken`

### Roles

Users can have `ROLE_USER` or `ROLE_ADMIN`. Admin routes (KYC review, user list) are protected by role checks in the respective services.

---

## Reliability Patterns

| Pattern | Where | Why |
|---|---|---|
| **Distributed locking (Redisson)** | wallet-service | Prevents two concurrent requests from double-spending the same wallet balance |
| **Optimistic locking (`@Version`)** | Wallet JPA entity | Database-level guard against lost updates |
| **Idempotency keys** | transaction-service | Client sends a unique key; duplicate requests within 24 h return the same result without re-executing the transfer |
| **Circuit breaker + Retry (Resilience4j)** | bank-integration-service | Stops hammering a failing external service; retries with backoff |
| **Kafka at-least-once delivery** | all event producers | Events are guaranteed to be delivered; consumers are written to handle duplicates |
| **Lazy profile creation** | user-service | If Kafka delivers `user-registered` late (startup rebalancing), the profile is created on the first API call instead — no user is ever stuck |
| **Soft delete** | all JPA entities | Records are never physically deleted; an `is_deleted` flag is set and a `@Where` filter hides them from queries |

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Node.js 18+
- Java 21+ *(only needed if you want to run services outside Docker)*

### Step 1 — Start everything with Docker

```bash
cd docker
docker compose up --build
```

This starts **19 containers**: PostgreSQL (7 instances), Kafka, Zookeeper, Redis, and all 9 Spring Boot services.

> First build takes ~5 minutes. Subsequent starts are fast.

Wait until you see lines like:
```
auth-service     | Started AuthServiceApplication in 4.2 seconds
wallet-service   | Started WalletServiceApplication in 3.8 seconds
```

### Step 2 — Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### Step 3 — Create an admin user

All registered users start as `ROLE_USER`. To promote a user to admin, connect to the auth database:

```bash
docker exec -it postgres-auth psql -U postgres -d postgres
```

```sql
-- Replace with your registered user's email
UPDATE users
SET roles = 'ROLE_USER,ROLE_ADMIN'
WHERE email = 'your@email.com';
```

---

## User Journey

Here is the complete end-to-end flow from registration to sending money.

### 1. Register
Go to `/register`. Fill in your name, email, and a password (minimum 8 characters). You will land on the login page.

### 2. Log In
Go to `/login`. After logging in you are taken to the dashboard. Wallets will appear once KYC is approved.

### 3. Submit KYC
Go to `/kyc`. Choose a document type (Passport, National ID, etc.), enter the document number, optionally set an expiry date, and **upload a file** (PDF, JPG, or PNG up to 10 MB). The file is stored on the server and a download URL is saved.

### 4. Approve KYC (admin)
Log in as an admin and go to `/admin → Pending KYC`. Click **Approve** next to the pending user — a confirmation dialog will ask you to confirm before the action executes.

Behind the scenes, `user-service` publishes a `kyc-approved` Kafka event. `wallet-service` listens and automatically provisions a **USD wallet** and an **INR wallet** for the approved user.

### 5. Dashboard
Return to `/dashboard` as the approved user. You will now see:
- Your wallets with formatted balances and copyable IDs
- A **7-day spending area chart** showing transaction activity
- Your **credit score**, risk level, and credit limit
- Recent transactions with amounts and statuses

### 6. Send Money
Go to `/transfer`. Select your source wallet (the available balance is shown as a hint), paste the recipient's **Wallet ID** and **User ID** (both are copyable from the dashboard), enter an amount, and submit.

A success card with the transaction ID appears, and a toast notification confirms the transfer.

### 7. Issue a Virtual Card
Go to `/cards`. Enter a cardholder name, choose a currency and optional spending limit, and click **Issue Virtual Card**.

The card appears as a blue gradient card. **Click it to flip it** — the back shows the issue date and spending limit. From the back you can freeze/unfreeze or permanently cancel the card (both with confirmation dialogs).

### 8. Transaction History
Go to `/transactions`. Use the **search box** to find by ID, type, or description. Use the **Type** and **Status** dropdowns to filter. On mobile, transactions display as cards instead of a table. Every transaction ID has a copy button.

---

## API Reference

All requests go through the gateway at `http://localhost:8080`. Protected routes require `Authorization: Bearer <token>`.

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Register a new user |
| POST | `/api/v1/auth/login` | — | Login, returns access + refresh tokens |
| POST | `/api/v1/auth/refresh` | — | Exchange refresh token for new access token |
| GET | `/api/v1/auth/me` | Bearer | Get authenticated user info |

**Register body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "Secure1234"
}
```

**Login response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "userId": "uuid",
  "email": "jane@example.com"
}
```

---

### Users & KYC

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/profile` | Bearer | Get own profile |
| GET | `/api/v1/kyc/status` | Bearer | Get KYC status and submitted documents |
| POST | `/api/v1/kyc/upload` | Bearer | Upload a document file (multipart/form-data, field: `file`) |
| POST | `/api/v1/kyc/documents` | Bearer | Submit document metadata after upload |
| GET | `/api/v1/users/admin/users?page=0&size=20` | Admin | Paginated list of all users |
| POST | `/api/v1/users/admin/kyc/{userId}/review` | Admin | Approve or reject KYC |

**Submit document body:**
```json
{
  "documentType": "PASSPORT",
  "documentNumber": "A1234567",
  "documentUrl": "/api/v1/kyc/files/uuid_filename.jpg",
  "expiryDate": "2030-01-01"
}
```

**Review body:** `{ "approved": true }`

---

### Wallets

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/wallets` | Bearer | Create a wallet |
| GET | `/api/v1/wallets` | Bearer | List my wallets |
| POST | `/api/v1/wallets/convert` | Bearer | Convert currency between wallets |

**Create wallet:** `{ "currency": "EUR" }`

---

### Transactions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/transactions/transfer` | Bearer | Transfer funds |
| GET | `/api/v1/transactions/history?page=0&size=20` | Bearer | Paginated history |
| GET | `/api/v1/transactions/{id}` | Bearer | Single transaction |
| POST | `/api/v1/transactions/{id}/refund` | Admin | Refund a transaction |

**Transfer body:**
```json
{
  "idempotencyKey": "any-unique-string-per-request",
  "fromWalletId": "uuid",
  "toWalletId": "uuid",
  "toUserId": "uuid",
  "amount": 100.00,
  "currency": "USD",
  "description": "Rent payment"
}
```

---

### Cards

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/cards` | Bearer | Issue a virtual card |
| GET | `/api/v1/cards` | Bearer | List my cards |
| POST | `/api/v1/cards/{id}/freeze` | Bearer | Freeze card |
| POST | `/api/v1/cards/{id}/unfreeze` | Bearer | Unfreeze card |
| DELETE | `/api/v1/cards/{id}` | Bearer | Cancel card permanently |

**Issue card:** `{ "cardholderName": "JANE DOE", "currency": "USD", "spendingLimit": 1000 }`

---

### Credit Scoring

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/credit/assess` | Bearer | Run credit assessment |
| GET | `/api/v1/credit/score` | Bearer | Get current credit score and limit |

**Assess body:**
```json
{
  "employmentStatus": "EMPLOYED",
  "annualIncome": 75000,
  "educationLevel": "BACHELORS",
  "visaType": "WORK",
  "university": "MIT"
}
```

---

### Bank Integration

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/bank/verify-account` | Bearer | Simulate verifying a bank account |
| POST | `/api/v1/bank/loan/apply` | Bearer | Simulate a loan application |

---

## Database Layout

Each service owns its own PostgreSQL database — **no shared schemas, no cross-database queries**. This is the database-per-service pattern that makes each service independently deployable.

| Service | Postgres container | Host port |
|---|---|---|
| auth-service | postgres-auth | 5433 |
| user-service | postgres-user | 5434 |
| wallet-service | postgres-wallet | 5435 |
| transaction-service | postgres-tx | 5436 |
| credit-scoring-service | postgres-credit | 5437 |
| card-service | postgres-card | 5438 |
| notification-service | postgres-notification | 5439 |

**Connect to any database directly:**
```bash
# Example: inspect wallet balances
docker exec -it postgres-wallet psql -U postgres -d postgres
SELECT id, currency, balance, status FROM wallets;
```

---

## Credit Scoring Algorithm

Scoring is rule-based and fully transparent. Every factor adds a fixed number of points to a base of 300.

| Factor | Points |
|---|---|
| Base | 300 |
| **Employment status** | |
| EMPLOYED | +200 |
| SELF_EMPLOYED | +150 |
| RETIRED | +120 |
| STUDENT | +100 |
| UNEMPLOYED | +30 |
| **Annual income** | |
| ≥ $100,000 | +200 |
| ≥ $50,000 | +150 |
| ≥ $25,000 | +100 |
| ≥ $10,000 | +60 |
| **Education level** | |
| PhD | +150 |
| Masters | +120 |
| Bachelors | +90 |
| **Visa type** | |
| Permanent resident / Citizen | +100 |
| Work visa / H-1B | +80 |
| Student visa / F-1 | +50 |
| University name provided | +50 |
| **Maximum possible** | **900** |

**Risk tiers and credit limits:**

| Score | Risk Level | Credit Limit |
|---|---|---|
| 750 – 900 | LOW | 50% of annual income |
| 600 – 749 | MEDIUM | 30% of annual income |
| 450 – 599 | HIGH | 15% of annual income |
| 300 – 449 | VERY_HIGH | 5% of annual income |

---

## Running Tests

```bash
cd backend
mvn clean test -pl shared,wallet-service,transaction-service,credit-scoring-service -am
```

**28 unit tests across 3 services:**

| Test class | Count | What is covered |
|---|---|---|
| `WalletServiceTest` | 10 | Debit/credit balance, distributed lock acquisition, insufficient funds rejection |
| `TransactionServiceTest` | 9 | Transfer execution, Redis idempotency check, DB idempotency fallback, refund flow, failure handling |
| `CreditScoringServiceTest` | 9 | Score boundaries for all input factors, risk tier thresholds, credit limit calculation |

---

## Project Structure

```
GlobePay/
├── backend/
│   ├── pom.xml                          # Maven multi-module parent
│   ├── shared/                          # Shared library used by all services
│   │   ├── events/                      # Kafka event POJOs (UserRegisteredEvent, etc.)
│   │   ├── exceptions/                  # Common exception types
│   │   └── response/                    # ApiResponse and PagedResponse wrappers
│   ├── api-gateway/                     # Spring Cloud Gateway + JWT filter
│   ├── auth-service/                    # Registration, login, JWT
│   ├── user-service/                    # Profiles, KYC, file upload
│   ├── wallet-service/                  # Wallets, balances, currency conversion
│   ├── transaction-service/             # Transfers, history, refunds
│   ├── credit-scoring-service/          # Credit score and risk assessment
│   ├── card-service/                    # Virtual cards
│   ├── bank-integration-service/        # External bank simulation with resilience
│   └── notification-service/            # Email via Kafka events
│
├── frontend/
│   ├── app/                             # Next.js App Router pages
│   │   ├── dashboard/page.tsx           # Wallets, 7-day chart, quick actions
│   │   ├── transfer/page.tsx            # Send money
│   │   ├── transactions/page.tsx        # History with search and filters
│   │   ├── kyc/page.tsx                 # Document upload
│   │   ├── cards/page.tsx               # Virtual cards with flip animation
│   │   ├── admin/page.tsx               # KYC review and user management
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── components/
│   │   ├── layout/Navbar.tsx            # Sticky navbar with active route highlight
│   │   └── ui/
│   │       ├── Badge.tsx                # Status badges (ACTIVE, PENDING, FAILED…)
│   │       ├── Card.tsx                 # White rounded card container
│   │       ├── ConfirmDialog.tsx        # Modal for destructive actions
│   │       ├── CopyButton.tsx           # Clipboard copy with checkmark feedback
│   │       ├── EmptyState.tsx           # No-data states with icons and CTAs
│   │       ├── LoadingSpinner.tsx
│   │       └── Skeleton.tsx             # Animated placeholder loaders
│   ├── contexts/
│   │   └── ToastContext.tsx             # Global bottom-right toast notifications
│   ├── services/                        # Axios wrappers, one file per domain
│   │   ├── auth.service.ts
│   │   ├── card.service.ts
│   │   ├── credit.service.ts
│   │   ├── transaction.service.ts
│   │   ├── user.service.ts
│   │   └── wallet.service.ts
│   ├── lib/
│   │   ├── api.ts                       # Axios instance with token refresh interceptor
│   │   ├── auth.ts                      # JWT decode, isAuthenticated, isAdmin
│   │   └── format.ts                    # formatCurrency, formatDate, truncate
│   └── types/index.ts                   # TypeScript interfaces for all entities
│
└── docker/
    └── docker-compose.yml               # 19 containers: 7 Postgres + Kafka + Zookeeper + Redis + 9 services
```

---

## Common Issues

**Port 8080 already in use**
Another container or process holds the port. Find and stop it:
```bash
lsof -ti:8080 | xargs kill -9
```

**Kafka `NodeExistsException` on startup**
Stale ZooKeeper state from a previous run. Wipe all volumes and restart:
```bash
docker compose down -v
docker compose up --build
```

**"User profile not found" after login**
The Kafka `user-registered` event was missed during startup rebalancing. The service handles this automatically — it creates the profile on your first API call. Refresh the page once and it will work.

**Wallets not appearing after KYC approval**
The `kyc-approved` Kafka event triggers wallet provisioning asynchronously. Wait 5–10 seconds after the admin approves, then refresh the dashboard.

**Registration fails with "password too short"**
Passwords must be at least 8 characters. The form shows this hint below the password field.

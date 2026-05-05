# SportsHub — Comprehensive Project Overview

> **Purpose**: This document provides an exhaustive technical and architectural overview of the SportsHub platform, designed for university presentation and showcase preparation. It covers every layer of the stack, design decisions, feature mechanics, and project organization.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Why This Stack?](#why-this-stack)
3. [Monorepo Architecture](#monorepo-architecture)
4. [Backend Deep Dive](#backend-deep-dive)
5. [Frontend Deep Dive](#frontend-deep-dive)
6. [Database & Domain Model](#database--domain-model)
7. [Authentication & Authorization](#authentication--authorization)
8. [Feature Architecture](#feature-architecture)
9. [Real-Time & SSE](#real-time--sse)
10. [AI Integration](#ai-integration)
11. [Automation & Scheduling](#automation--scheduling)
12. [Development Workflow](#development-workflow)
13. [Deployment Architecture](#deployment-architecture)
14. [Key Patterns & Conventions](#key-patterns--conventions)
15. [Environment Configuration](#environment-configuration)

---

## Executive Summary

**SportsHub** is a multi-league sports competition management platform. It enables universities, clubs, or organizations to create independent sports leagues, manage delegations (teams), enroll athletes, generate competition brackets, track results in real-time, and produce AI-powered narratives and reports.

The platform supports **10 canonical sports** (Futebol, Basquete, Volei, Handebol, Tenis, Natacao, Atletismo, Judo, Boxe, Karate) with configurable modalities per gender, automated bracket generation (group stage, single elimination, double elimination, Swiss, hybrid formats), medal boards, activity feeds, and real-time match notifications.

The system operates in **weekly competition cycles**: each week is a "Competition" that gets scheduled, locked (enrollments close), bracket matches are auto-generated, and results are tracked. An optional **auto-simulation mode** can run matches automatically for demo purposes.

---

## Why This Stack?

### Philosophy

The stack was chosen around three pillars:

1. **Type safety end-to-end**: From database schema to API contracts to frontend components
2. **Developer velocity**: Fast iteration with hot reload, shared code, and auto-generated types
3. **Production readiness**: SSR, edge deployment, async database access, real-time streaming, rate limiting

### Technology Choices & Rationale

#### Frontend

| Technology | Version | Why It Was Chosen |
|------------|---------|-------------------|
| **TanStack Start** | v1.x | Full-stack React framework with SSR, file-based routing, and server functions. Replaces Next.js with a more data-centric, router-first approach |
| **TanStack Router** | v1.x | Type-safe routing with automatic route tree generation, nested layouts, `beforeLoad` guards, and deep link prefetching |
| **TanStack Query** | v5.x | Server-state synchronization with caching, stale-while-revalidate, optimistic updates, and shared `queryOptions` between loaders and hooks |
| **TanStack Form** | v1.x | Headless, type-safe form handling with validation integration |
| **Tailwind CSS v4** | v4.x | Utility-first CSS with zero runtime, Vite-native plugin, design system consistency |
| **shadcn/ui** | latest | Copy-paste accessible component primitives (Radix UI + Tailwind), stored in `packages/ui` for cross-project sharing |
| **openapi-fetch** | v0.17 | Generates a fully typed API client from the backend's OpenAPI spec. Zero manual type maintenance |
| **Recharts** | v3.x | Declarative React charting for dashboards and analytics |
| **Motion** | v12.x | Animation library (formerly Framer Motion) for UI transitions |
| **Paraglide** | v2.x | Internationalization (i18n) with compile-time message extraction and type-safe message keys |

#### Backend

| Technology | Version | Why It Was Chosen |
|------------|---------|-------------------|
| **FastAPI** | v0.115 | High-performance async Python web framework with automatic OpenAPI generation, dependency injection, and native async support |
| **SQLModel** | v0.0.22 | Combines SQLAlchemy ORM with Pydantic models. Single source of truth for database tables and validation schemas |
| **Alembic** | v1.14 | Database migration tool for SQLAlchemy. Runs automatically on startup |
| **PostgreSQL** | 15+ | Production-grade relational database with asyncpg driver for true async I/O |
| **Pydantic v2** | latest | Fast, strict data validation for request/response schemas and settings |
| **PyJWT** | v2.8 | JWT token creation and verification for stateless auth |
| **APScheduler** | v3.10 | In-process async job scheduler for competition auto-lock, match reminders, and auto-simulation |
| **sse-starlette** | v3.3 | Server-Sent Events (SSE) streaming for real-time match updates and activity feeds |
| **slowapi** | v0.1.9 | Rate limiting middleware with Redis-backed or in-memory storage |
| **orjson** | v3.11 | Fastest Python JSON serializer. Used as the default response class |
| **httpx** | v0.28 | Modern async HTTP client for OAuth and AI API calls |
| **tenacity** | v9.1 | Retry logic with exponential backoff for external API calls (Groq) |

#### AI

| Technology | Why It Was Chosen |
|------------|-------------------|
| **Groq API** | Free tier available, extremely fast inference (llama-3.3-70b-versatile). Falls back to mock templates when key is missing |

#### Infrastructure & Tooling

| Technology | Why It Was Chosen |
|------------|-------------------|
| **Bun** | Ultra-fast JavaScript runtime and package manager. Workspace-native monorepo support |
| **uv** | Modern Python package manager (Rust-based). Replaces pip/poetry with `uv sync` and lock files |
| **Turborepo** | Monorepo task orchestration with caching and parallel execution |
| **oxlint + oxfmt** | Fast Rust-based JavaScript linter and formatter |
| **Alchemy** | Infrastructure-as-code for Cloudflare Workers deployment |
| **Cloudflare Workers** | Edge-deployed frontend with global CDN, SSR support via Vite plugin |
| **Railway** | Managed backend hosting with PostgreSQL. Single-process requirement for SSE |

---

## Monorepo Architecture

```text
sports-system/
├── apps/
│   ├── web/                    # TanStack Start frontend (port 3001)
│   │   ├── src/
│   │   │   ├── routes/         # File-based TanStack Router routes
│   │   │   ├── features/       # Domain vertical slices
│   │   │   ├── shared/         # Cross-cutting utilities, hooks, layouts
│   │   │   ├── types/          # Auto-generated API types (api.gen.ts)
│   │   │   └── paraglide/      # i18n compiled messages
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── api/                    # FastAPI backend (port 3000)
│       ├── app/
│       │   ├── main.py         # Composition root: routers, middleware, lifespan
│       │   ├── config.py       # Pydantic Settings with env file
│       │   ├── database.py     # Async SQLAlchemy engine + session factory
│       │   ├── domain/
│       │   │   ├── models/     # SQLModel table definitions
│       │   │   └── schemas/    # Pydantic request/response DTOs
│       │   ├── features/       # Domain vertical slices
│       │   │   ├── auth/
│       │   │   ├── leagues/
│       │   │   ├── delegations/
│       │   │   ├── athletes/
│       │   │   ├── competitions/
│       │   │   ├── events/
│       │   │   ├── bracket/
│       │   │   ├── enrollments/
│       │   │   ├── results/
│       │   │   ├── narratives/
│       │   │   ├── reports/
│       │   │   ├── notifications/
│       │   │   ├── activities/
│       │   │   ├── search/
│       │   │   ├── users/
│       │   │   ├── admin/
│       │   │   └── health/
│       │   └── shared/
│       │       └── core/       # auth, security, limiter, scheduler, sse, deps
│       ├── alembic/            # Database migrations
│       ├── pyproject.toml      # Python dependencies (uv)
│       └── .env.example
│
├── packages/
│   ├── ui/                     # Shared shadcn/ui components
│   ├── contracts/              # Shared Zod schemas for form validation
│   ├── env/                    # Environment validation (t3-env + Zod)
│   ├── config/                 # Shared TypeScript configurations
│   └── infra/                  # Cloudflare deployment (Alchemy IaC)
│
├── package.json                # Root workspace configuration (Bun)
├── turbo.json                  # Turborepo pipeline
└── bun.lock                    # Bun lockfile
```

### Workspace Dependencies

Bun workspaces link packages via `workspace:*` protocol. The frontend depends on:
- `@sports-system/ui` — shared UI components
- `@sports-system/contracts` — Zod validation schemas
- `@sports-system/env` — typed environment variables

The backend is a standalone Python app but shares the same repo for atomic changes.

---

## Backend Deep Dive

### Application Lifespan

`app/main.py` defines the FastAPI application with an `asynccontextmanager` lifespan:

1. **Configure logging** — JSON-structured logs to stdout
2. **Run migrations** — Alembic upgrades to head automatically
3. **Seed sports** — Inserts 10 canonical sports with modalities if the `sports` table is empty
4. **Start scheduler** — APScheduler begins background jobs (auto-lock, reminders)
5. **On shutdown** — Scheduler shuts down gracefully

This means a fresh database automatically creates tables, seeds data, and starts automation on the first run.

### Layered Architecture

The backend follows strict **vertical slicing** with horizontal layers:

```
HTTP Request
    |
    v
Router (thin) — validates input, extracts deps, returns HTTP responses
    |
    v
Service (business logic) — orchestrates operations, enforces rules
    |
    v
Repository (data access) — SQLModel queries, no business logic
    |
    v
Domain Model (SQLModel) — table definitions, relationships, enums
```

#### Router Layer

Routers are thin. They delegate all work to services. Example from `features/competitions/router.py`:
- Parse query params
- Inject `AsyncSession` dependency
- Call `service.list_competitions(session, ...)`
- Return Pydantic response model

#### Service Layer

Services contain all business logic. They:
- Validate state transitions (e.g., `DRAFT -> SCHEDULED -> LOCKED -> ACTIVE -> COMPLETED`)
- Enforce authorization rules
- Call repositories
- Trigger side effects (SSE broadcasts, notifications)
- Use `background_tasks` for async work (AI generation)

Example: `CompetitionService.lock_competition()` transitions status, then calls `bracket_service.generate()` to create matches.

#### Repository Layer

Repositories encapsulate all database queries. They:
- Accept `AsyncSession` as first parameter
- Return domain models or raw data
- Never contain business logic
- Are imported by services, never by routers directly

#### Domain Model Layer

SQLModel classes define tables. They combine SQLAlchemy `Column` definitions with Pydantic validation. All timestamps are stored in **UTC without timezone info** (`replace(tzinfo=None)`), then business logic converts to the league's configured timezone using `ZoneInfo`.

### Dependency Injection

FastAPI's native DI provides:
- `AsyncSession` from `app.database.get_session()` — async SQLAlchemy session per request
- `current_user` from `app.shared.core.deps.get_current_user()` — JWT verification
- `league_membership` from `app.shared.core.deps.require_league_role(...)` — RBAC enforcement

### Error Handling

Three exception handlers in `main.py`:

1. **HTTPException** → `ORJSONResponse` with `{error, detail, code}`
2. **RequestValidationError** (Pydantic) → `422` with field-level errors
3. **Unhandled Exception** → `500` with sanitized message, logged with stack trace

All responses use `ORJSONResponse` for ~2-3x faster JSON serialization than standard `json.dumps`.

### Rate Limiting

`slowapi` is configured as middleware. Rate limits are applied per endpoint:

```python
from app.shared.core.limiter import limiter

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

`request: Request` must be the first parameter for slowapi to work.

---

## Frontend Deep Dive

### Routing Architecture

TanStack Router uses **file-based routing**. Files inside `src/routes/` automatically become URLs:

```text
routes/
├── __root.tsx                 # Root layout, providers, auth check
├── index.tsx                  # /
├── login.tsx                  # /login
├── register.tsx               # /register
├── _authenticated.tsx         # Layout guard — redirects if not logged in
│   ├── profile.tsx            # /profile
│   ├── my-leagues.tsx         # /my-leagues
│   └── my-delegations/        # /my-delegations
│       └── $delegationId/
│           └── edit.tsx        # /my-delegations/123/edit
│
└── leagues/
    ├── index.tsx              # /leagues
    ├── new.tsx                # /leagues/new
    └── $leagueId/
        ├── __layout.tsx       # League layout (sidebar, nav)
        ├── index.tsx          # /leagues/123
        ├── (public)/          # Public routes within league
        │   ├── results/       # /leagues/123/results
        │   ├── feed/          # /leagues/123/feed
        │   └── sports/
        │       └── $sportId/
        │           └── bracket.tsx
        └── _authenticated/    # Protected league routes
            ├── dashboard.tsx  # /leagues/123/dashboard
            └── dashboard/
                ├── _chief/    # Chief-only routes
                ├── _league_admin/  # Admin-only routes
                └── matches/
                    └── $matchId/
                        └── index.tsx
```

#### Route Guards

`beforeLoad` on route definitions checks authentication. The `_authenticated.tsx` layout route runs `getSessionFn()` and redirects to `/login` if no valid session exists.

#### SSR Strategy

Per-route SSR configuration:
- **Public pages** (`leagues/$leagueId/(public)/...`) — Full SSR for SEO
- **Auth pages** — `data-only` SSR (hydrate quickly)
- **Live/AI pages** — `ssr: false` (client-only, no server fetch)

### Data Fetching Pattern

The frontend uses a **shared `queryOptions()` factory** pattern:

```typescript
// features/leagues/api/queries.ts
export function leagueQueryOptions(leagueId: string) {
  return queryOptions({
    queryKey: ["leagues", leagueId],
    queryFn: async () => {
      return unwrap(client.GET("/leagues/{league_id}", {
        params: { path: { league_id: Number(leagueId) } },
      }));
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

This same `queryOptions` is used in:
1. **Route loaders** — data is fetched during SSR/navigation
2. **Components** — `useSuspenseQuery(leagueQueryOptions(leagueId))`

Stale time varies by data type:
- Lists: 2 minutes
- Medal board: 30 seconds
- AI-generated content: 10 minutes

### API Client

`apps/web/src/shared/lib/api.ts` wraps `openapi-fetch`:

```typescript
import createClient from "openapi-fetch";
import type { paths } from "@/types/api.gen";

const client = createClient<paths>({
  baseUrl: buildApiUrl(""),
  credentials: "include",
});

// Interceptor: inject Bearer token from cookie
client.use({
  onRequest({ request }) {
    const token = document.cookie
      .split("; ")
      .find(c => c.startsWith("access_token="));
    if (token) {
      request.headers.set("Authorization", `Bearer ${token.split("=")[1]}`);
    }
  },
});
```

The `unwrap()` helper extracts typed data or throws `ApiError` with status/code/message.

### Server Functions

TanStack Start's `createServerFn` runs code on the server during SSR or API calls:

```typescript
export const loginFn = createServerFn({ method: "POST" })
  .inputValidator((data: LoginRequest) => data)
  .handler(async ({ data }) => {
    const res = await fetch(buildApiUrl("/auth/login"), { ... });
    const tokens = await res.json();
    setCookie("access_token", tokens.access_token, { httpOnly: false, ... });
    setCookie("refresh_token", tokens.refresh_token, { httpOnly: true, ... });
    return tokens;
  });
```

This allows auth cookie handling without exposing tokens to client-side JavaScript for the refresh token.

### Component Architecture

Components are organized by **feature**, not by type:

```text
features/
├── auth/
│   ├── components/
│   │   ├── login-form.tsx
│   │   └── auth-card.tsx
│   ├── api/queries.ts
│   └── server/auth.ts
├── bracket/
│   └── components/
│       ├── match-card.tsx
│       ├── single-elimination.tsx
│       ├── double-elimination.tsx
│       ├── group-stage.tsx
│       └── swiss-stage.tsx
└── narratives/
    └── components/
        └── ai-generate-button.tsx
```

Shared/cross-cutting code lives in `shared/`:
- `shared/components/` — layouts, loading states, error screens
- `shared/lib/` — API client, URL builder, date utilities
- `shared/hooks/` — custom React hooks

### UI Components

`packages/ui` contains shadcn/ui primitives (Button, Card, Dialog, Table, Form, etc.). Components are built on **Radix UI** (headless, accessible) + **Tailwind CSS** (styling).

New shadcn components are added to the shared package first. Custom components are only created when no suitable primitive exists.

### Theming

`next-themes` provides palette switching:
- Themes: `blue`, `green`, `orange`, `dark`
- Attribute: `data-palette`
- Default: `dark` mode with `blue` palette

### Internationalization

Paraglide v2 provides:
- Compile-time message extraction
- Type-safe message keys
- Locale detection and routing
- Messages stored in `apps/web/messages/` and compiled to `src/paraglide/`

---

## Database & Domain Model

### Database: PostgreSQL + asyncpg

All database operations are **fully async** via `asyncpg` and SQLAlchemy's `AsyncSession`. This allows the FastAPI server to handle thousands of concurrent connections without blocking the event loop.

### Entity Relationship Overview

```
User (1) ----< RefreshToken
      |
      |----< ChiefRequest
      |
      |----< Notification
      |
      |----< LeagueMember >---- League (1)
      |                              |
      |                              |----< Competition
      |                              |         |
      |                              |         |----< Event
      |                              |         |         |
      |                              |         |         |----< Match
      |                              |         |         |         |
      |                              |         |         |         |----< MatchEvent
      |                              |         |         |         |
      |                              |         |         |         |----< MatchParticipant
      |                              |         |         |
      |                              |         |         |----< Result
      |                              |         |
      |                              |         |----< Enrollment
      |                              |
      |                              |----< Athlete >---- AthleteModality
      |                              |         |
      |                              |         |----< Enrollment
      |                              |
      |                              |----< Delegation >---- DelegationMember
      |                              |         |
      |                              |         |----< DelegationInvite
      |                              |         |
      |                              |         |----< LeagueParticipationRequest
      |                              |         |
      |                              |         |----< LeagueDelegation
      |                              |
      |                              |----< Sport >---- Modality
      |                                       |
      |                                       |---- SportStatisticsSchema
      |
      |----< Narrative
      |
      |----< AIGeneration
```

### Key Tables

#### `users`
The central identity table. Contains email, name, hashed_password, global role (`SUPERADMIN`, `ADMIN`, `USER`, `ATHLETE`, `CHIEF`, `COACH`), avatar, activation status.

#### `leagues`
Independent competition containers. Configurable timezone, auto-simulation flag, transfer window, match duration, schedule interval. Status: `ACTIVE` or `ARCHIVED`. Mode: `NORMAL` or `SPEED`.

#### `league_members`
Many-to-many join with roles: `LEAGUE_ADMIN`, `CHIEF`, `COACH`, `ATHLETE`. Separate from global roles — a user can be an admin in one league and an athlete in another.

#### `delegations`
Teams within a league. Each has a unique 3-letter code, name, flag, chief. Status tracks participation: `INDEPENDENT`, `PENDING`, `APPROVED`, `REJECTED`.

#### `athletes`
League-scoped athlete profiles. Linked optionally to a `user` account. Contains gender, birthdate, unique code. Athletes belong to delegations via `DelegationMember`.

#### `competitions`
Weekly competition cycles. Status machine: `DRAFT -> SCHEDULED -> LOCKED -> ACTIVE -> COMPLETED`. `sport_focus` is a JSON array of sport IDs for that week.

#### `events`
Scheduled matches within a competition. Linked to a `modality`. Has date, time, venue, phase (`GROUPS`, `QUARTER`, `SEMI`, `FINAL`, `BRONZE`), and status.

#### `matches`
Individual games. Links two delegations (or two athletes for individual sports). Tracks score, winner, status, start/end times. `score_detail_json` stores sport-specific structured data (sets, quarters, etc.).

#### `enrollments`
Athlete registrations for events. Status: `PENDING`, `APPROVED`, `REJECTED`. Validation rules checked at creation time (gender, roster size, weight category, schedule conflicts).

#### `results`
Final rankings per match. Contains rank, medal (`GOLD`, `SILVER`, `BRONZE`), and `value_json` for sport-specific metrics.

#### `narratives` & `ai_generations`
AI-generated content storage. Narratives are daily competition summaries. `AIGeneration` tracks AI usage for audit/debugging.

### JSON-Powered Flexibility

Several tables use JSON columns for sport-specific configuration without schema changes:
- `Sport.rules_json` — generic sport rules
- `Modality.rules_json` — modality-specific rules (team size, bracket format, gender, weight category)
- `Match.score_detail_json` — structured scores (sets, quarters, halves)
- `AthleteStatistic.stats_json` — per-sport statistics
- `SportStatisticsSchema.stats_schema` — JSON Schema defining available stats per sport

This allows adding new sports or rule variations without database migrations.

---

## Authentication & Authorization

### Authentication Methods

1. **Password-based registration/login**
   - Password hashed with `fastapi-users` PasswordHelper (bcrypt)
   - Returns access token (JWT, 30 min) + refresh token (SHA256 hash stored in DB, 30 days)

2. **OAuth 2.0** — Google and GitHub
   - State parameter signed with JWT to prevent CSRF
   - Relay token pattern: backend redirects to frontend with a short-lived signed token, frontend exchanges it for real tokens via `finalize_oauth`
   - Creates user account automatically if email not found

3. **Token refresh**
   - Access token stored in `access_token` cookie (non-httpOnly, readable by JS for API calls)
   - Refresh token stored in `refresh_token` cookie (httpOnly, secure)
   - `/auth/refresh` endpoint revokes old refresh token and issues new pair

### Authorization Model

**Two-tier RBAC:**

#### Global Roles (on `users` table)
- `SUPERADMIN` — Platform-wide access, seed data, user management
- `ADMIN` — Platform administration
- `USER` — Basic registered user
- `ATHLETE` — Default role on registration
- `CHIEF` — Can create/manage delegations
- `COACH` — Can manage athletes within delegation

#### League Roles (on `league_members` table)
- `LEAGUE_ADMIN` — Full control over a specific league
- `CHIEF` — Manages their delegation within a league
- `COACH` — Manages athletes
- `ATHLETE` — Participant

Authorization checks in services:
```python
if membership.role != LeagueMemberRole.LEAGUE_ADMIN:
    chief_delegation_id = await get_current_delegation_id(session, user_id, league_id)
    if chief_delegation_id != data.delegation_id:
        raise HTTPException(403, "Cannot enroll athletes for another delegation")
```

### Security Features

- JWT signed with HS256 (`SECRET_KEY` must be >= 32 bytes)
- Refresh token rotation (old token revoked on refresh)
- Rate limiting on auth endpoints (5/minute)
- CORS restricted to `FRONTEND_URL`
- Passwords never returned in API responses

---

## Feature Architecture

### 1. Multi-League Management

- Any authenticated user can create a league
- League creator becomes `LEAGUE_ADMIN`
- Leagues have configurable sports, timezones, and simulation modes
- Public pages (`(public)/` routes) show league info, results, brackets without login

### 2. Delegation System

**Two delegation models:**

#### League Delegations
- Created by league admins within a specific league
- Must request participation via `LeagueParticipationRequest`
- Chief manages members, invites, transfers

#### Independent Delegations
- Created by users via "My Delegations"
- Exist outside leagues initially
- Can join leagues through participation requests

**Member Management:**
- Chiefs invite users via `DelegationInvite`
- Members have roles: `CHIEF`, `COACH`, `ATHLETE`
- Transfer window allows moving athletes between delegations (configurable day/time check)

### 3. Competition Scheduling

**Competition Lifecycle:**

```
DRAFT
  |
  |-- admin publishes
  v
SCHEDULED  <-- athletes enroll, events created
  |
  |-- first event start time passes (auto) OR admin locks
  v
LOCKED     <-- enrollments closed, bracket generated
  |
  |-- admin activates
  v
ACTIVE     <-- matches in progress
  |
  |-- all matches completed
  v
COMPLETED
```

**Schedule Generation:**
- AI can generate events based on competition's `sport_focus`
- Events are created per modality with date, time, venue
- Schedule service distributes events across the competition date range

### 4. Bracket Generation

The `bracket_service` supports multiple tournament formats defined in `modality.rules_json["bracket_format"]`:

| Format | Description |
|--------|-------------|
| `group-stage` | Round-robin within groups. Top teams advance |
| `group-stage-se` | Group stage + Single Elimination knockout |
| `group-stage-de` | Group stage + Double Elimination knockout |
| `single-elimination` | Standard knockout bracket |
| `double-elimination` | Winner's and Loser's brackets |
| `swiss` | Swiss-system tournament |

**Bracket Algorithm:**
1. Read approved enrollments for the event
2. Determine format from modality rules
3. Group stage: round-robin pairings within groups
4. Elimination: seed pairs using power-of-2 bracket with byes for top seeds
5. Create `Match` rows for the first round
6. Generate skeleton `Event` rows for subsequent phases (semi, final, bronze)

### 5. Enrollment Validation

Generic engine reads `modality.rules_json`:

- **Gender check**: Matches athlete gender to modality requirement (`M`, `F`, or `MIXED`)
- **Roster size**: Counts existing enrollments, caps at `roster_size` or `player_count + substitutes`
- **Weight category**: Validates `AthleteModality.category` matches
- **Schedule conflict**: Prevents double-booking athletes at the same date/time
- **Eligibility**: Checks athlete hasn't already competed in the same competition week

All validation is **declarative** via JSON rules — no per-sport hardcoded logic.

### 6. Results & Medal Tracking

**Result Entry:**
- Manual entry via dashboard after match completion
- Stores rank, medal, and `value_json` for detailed metrics

**Medal Board:**
- Aggregates medals per delegation across all competitions
- Real-time updates via SSE when new results are added
- Per-sport medal boards available

**Sport Standings:**
- Ranked list per modality showing athlete/delegation performance

**Records:**
- Tracks best performances per modality (e.g., fastest time, highest score)
- Records are immutable snapshots with competition context

### 7. Match Simulation

`simulation_service` generates realistic sport-specific results without AI:

- Triggered by APScheduler every minute when `AUTO_SIMULATE=true`
- Starts scheduled matches at their start time
- Generates scores after `match_duration_seconds` (default 5 min for demo)
- Sport-specific score ranges (e.g., football 0-5 goals, basketball 60-100 points)
- Creates `MatchEvent` entries (goals, cards, points)
- Updates `AthleteStatistic` with randomized but realistic stats
- Manual simulation available via `POST /admin/simulate/match/{id}` regardless of `AUTO_SIMULATE`

---

## Real-Time & SSE

Server-Sent Events provide three real-time channels:

### 1. Match Events (`/events/matches/{id}/live`)
- Streams `match_event` payloads (goals, cards, substitutions)
- Each match has its own `asyncio.Queue`
- Broadcast when `add_match_event` is called

### 2. Activity Feed (`/activities/leagues/{id}/feed`)
- League-scoped feed of match starts, finishes, and events
- Used on public league pages for "live ticker" experience

### 3. Global Activity Feed (`/activities/global/feed`)
- Cross-league feed for platform-wide activity

### 4. Medal Board (`/results/leagues/{id}/medal-board/live`)
- Pushes `medal_board_updated` when results change
- Frontend refreshes medal board data on this event

### SSE Implementation

```python
# app/shared/core/sse.py
_queues: dict[int, list[asyncio.Queue[str]]] = defaultdict(list)

async def broadcast(match_id: int, payload: dict) -> None:
    data = json.dumps(payload)
    for q in list(_queues.get(match_id, [])):
        await q.put(data)
```

Routers use `sse-starlette`'s `EventSourceResponse`:

```python
from sse_starlette.sse import EventSourceResponse

@router.get("/matches/{match_id}/live")
async def match_live(match_id: int):
    q = sse.subscribe(match_id)
    async def generator():
        while True:
            data = await q.get()
            yield {"event": "message", "data": data}
    return EventSourceResponse(generator(), ping=20)
```

**Important constraint**: SSE requires a single `uvicorn` process. Multiple workers would split the in-memory queues, causing clients to miss events. Railway deployment uses no `--workers` flag.

---

## AI Integration

All AI features use **Groq's free tier** with `llama-3.3-70b-versatile`. If `GROQ_API_KEY` is not set, the system falls back to **mock templates** with a clear disclaimer.

### AI Features

#### 1. Daily Narratives
- Generates sports journalism-style summaries of a competition day
- Prompt includes: match results, medal standings, key events
- Stored in `narratives` table with `type = "daily"`

#### 2. League Resume
- Executive summary of overall league standings and highlights
- Prompt aggregates competition results across the season
- Stored with `type = "resume"`

#### 3. Delegation Generation (`Gerar com IA`)
- Creates random delegations from a curated pool of country/state/city names
- Generates unique 3-letter codes
- No LLM call needed — uses deterministic pool

#### 4. Smart Population (`Popular com IA`)
- Analyzes existing delegations in a league
- Sends names/codes to LLM as context
- LLM generates new delegations in the same style
- Parses JSON array from LLM response with regex fallback

#### 5. Enrollment Generation
- Randomly assigns enrolled athletes to events in open competitions
- Uses existing delegation members and athletes
- Creates up to 30 approved enrollments

### Retry Logic

`tenacity` provides exponential backoff for Groq API calls:
- Retries on: timeouts, network errors, 5xx errors, 429 rate limit
- Max 3 attempts
- Wait: 2s -> 4s -> 8s -> max 10s

### Mock Fallback

When Groq is unavailable:
```python
def _mock_narrative(context: str) -> str:
    return (
        "**Narrativa do Dia** *(modo demonstração)*\n\n"
        "Mais um dia intenso de competições...\n\n"
        f"*Contexto:* {context[:200]}..."
    )
```

---

## Automation & Scheduling

APScheduler runs three background jobs:

### 1. Auto-Lock Competitions (`every 5 minutes`)
- Scans all active leagues
- Finds competitions in `SCHEDULED` status
- Checks if first event's start time has passed
- Transitions to `LOCKED`, triggers bracket generation
- Logs: `"auto_lock_competition competition_id=X bracket_matches=Y"`

### 2. Match Reminders (`daily at 03:00 UTC` = midnight Sao Paulo)
- Finds events scheduled for tomorrow
- Sends `NotificationType.MATCH_REMINDER` to all enrolled athletes with linked user accounts
- Deduplicates per user per event

### 3. Auto-Simulation (`every 1 minute` when enabled)
- Not in `scheduler.py` — integrated into match lifecycle
- Starts matches at scheduled time
- Generates results after configured duration
- Updates scores, match events, athlete statistics

### Transfer Window

No scheduler job needed — it's a **pure time check**:
```python
def is_transfer_window_open(league):
    now = datetime.now(ZoneInfo(league.timezone))
    return league.transfer_window_enabled and now.weekday() == 0  # Monday
```

---

## Development Workflow

### Package Managers

- **JavaScript**: `bun` (never npm/yarn)
- **Python**: `uv` (never pip directly)

### Commands

```bash
# Install everything
bun install
cd apps/api && uv sync

# Dev mode (frontend + backend + infra watcher)
bun dev

# Frontend only
bun run dev:web

# Backend only
bun run dev:backend   # uvicorn --reload --port 3000

# Database
bun run db:up         # alembic upgrade head
bun run db:new "msg"  # alembic revision --autogenerate
bun run db:down       # alembic downgrade -1

# Type checking
bun run check-types   # tsc --noEmit across workspace

# Lint + format
bun run check         # oxlint && oxfmt --write

# API type generation
cd apps/web && bun run gen:types    # from localhost:3000/openapi.json

# CI: detect API drift
cd apps/web && bun run check:api    # fails if spec differs from committed types
```

### API Type Synchronization

The frontend's `src/types/api.gen.ts` is **auto-generated** from the backend's OpenAPI spec:

1. Backend exposes `/openapi.json` (when `DEBUG=true`)
2. `openapi-typescript` consumes it and generates TypeScript types
3. `openapi-fetch` uses these types for end-to-end type safety
4. CI runs `check:api` to prevent schema drift

**Never manually edit `api.gen.ts` or `routeTree.gen.ts`.**

---

## Deployment Architecture

### Frontend: Cloudflare Workers

- Built with Vite + `@cloudflare/vite-plugin`
- Deployed via `alchemy` (Infrastructure-as-Code)
- SSR-capable at the edge
- Global CDN for static assets
- **SSE must bypass Workers** — browser connects directly to Railway backend (Workers have CPU time limits)

### Backend: Railway

- Single `uvicorn` process (no `--workers`)
- PostgreSQL database managed by Railway
- Environment variables injected via Railway dashboard
- `FRONTEND_URL` must match Cloudflare Workers domain for CORS

### Infrastructure Package

```typescript
// packages/infra/ main deployment script
import alchemy from "alchemy";

const app = await alchemy("sports-system", {
  // Cloudflare Worker + DNS + R2 bucket configuration
});
```

Run: `bun run deploy` (sets `NODE_ENV=production`)

### File Storage

Optional Cloudflare R2 integration for:
- Delegation flags
- Athlete avatars
- League logos

Uses `boto3` (S3-compatible API) with custom endpoint.

---

## Key Patterns & Conventions

### Backend

1. **Layer order**: Router → Service → Repository → Model
2. **No comments unless non-obvious** — self-explanatory code preferred
3. **Timestamps in UTC** — `datetime.now(timezone.utc).replace(tzinfo=None)`
4. **Business timezone** — `ZoneInfo(settings.TIMEZONE)` for display logic
5. **ORJSONResponse** — default for all responses including exceptions
6. **Background tasks** — use `BackgroundTasks` for AI generation, email, notifications
7. **Pydantic v2** — all schemas use `model_validate()`, `model_dump()`

### Frontend

1. **@/ imports only** — no relative `../` paths within `src/`
2. **Feature folders** — code lives next to the domain it serves
3. **Shared code** — only truly cross-cutting code goes in `shared/`
4. **queryOptions pattern** — share data config between loaders and hooks
5. **Route guards** — `beforeLoad` for auth, `_authenticated.tsx` layouts
6. **SSR strategy** — explicit per-route: full SSR, data-only, or client-only
7. **Library-first** — TanStack > shadcn > custom components

### Database

1. **SQLModel** — one class = one table + one Pydantic schema
2. **JSON columns** — sport-specific config without migrations
3. **Enum tables** — use SQLAlchemy `Enum` with explicit names for PostgreSQL
4. **Async everything** — `AsyncSession`, `await session.execute()`

---

## Environment Configuration

### Backend (`apps/api/.env`)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `SECRET_KEY` | Yes | — | JWT signing key (min 32 bytes) |
| `FRONTEND_URL` | Yes | — | CORS allowed origin |
| `BACKEND_PUBLIC_URL` | Yes | — | Public URL for OAuth callbacks |
| `PORT` | No | 3000 | API server port |
| `TIMEZONE` | No | America/Sao_Paulo | Business logic timezone |
| `DEBUG` | No | true | Enable /docs, /redoc, /openapi.json |
| `GROQ_API_KEY` | No | — | Enables AI narratives (free at console.groq.com) |
| `GOOGLE_OAUTH_*` | No | — | Google OAuth credentials |
| `GITHUB_OAUTH_*` | No | — | GitHub OAuth credentials |
| `R2_*` | No | — | Cloudflare R2 object storage |
| `ALGORITHM` | No | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | 30 | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | 30 | Refresh token TTL |

### Frontend (`apps/web/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SERVER_URL` | Yes | Backend URL for API calls |
| `VITE_TIMEZONE` | No | Display timezone (default: America/Sao_Paulo) |

### Infra (`packages/infra/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SERVER_URL` | Yes | Production backend URL |
| `CORS_ORIGIN` | Yes | Production frontend origin |
| `ALCHEMY_PASSWORD` | Yes | Alchemy state encryption |
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API access |

---

## Seed & Bootstrap

### First Run

On first startup:
1. Alembic creates all tables
2. `seed_sports()` inserts 10 sports, ~20 modalities, and statistics schemas
3. Scheduler starts

### First Superadmin

1. Register a user via `/auth/register`
2. Manually promote in database:
   ```sql
   UPDATE users SET role = 'SUPERADMIN' WHERE email = 'owner@example.com';
   ```
3. No API endpoint promotes to superadmin for security

### Demo Data

Superadmins/league admins can generate demo data via dashboard buttons:
- **Delegations** → "Gerar com IA" (random) / "Popular com IA" (LLM-based)
- **Athletes** → AI generation
- **Modalities** → AI generation
- **Events** → AI schedule generation
- **Enrollments** → AI auto-enroll

---

## Notable Technical Decisions

### Why TanStack Start over Next.js?

TanStack Start was chosen for its router-first architecture, fully type-safe routing, and deep TanStack Query integration. It provides SSR without the magic/lock-in of Next.js App Router, and its file-based routing with `beforeLoad` guards feels more explicit and controllable.

### Why SQLModel over raw SQLAlchemy + Pydantic?

SQLModel eliminates the duplication between SQLAlchemy table definitions and Pydantic schemas. A single class serves as both the ORM model and the validation schema, reducing maintenance and preventing drift.

### Why SSE over WebSockets?

SSE is simpler for server-to-client streaming:
- Native HTTP, no protocol upgrade
- Automatic reconnection
- Works through most proxies/firewalls
- Simpler authentication (standard HTTP headers/cookies)
- `sse-starlette` handles ping frames automatically

The tradeoff is unidirectional (server → client only), which is sufficient since all client actions use standard HTTP POST/PUT.

### Why Groq over OpenAI/Anthropic?

Groq offers:
- Free tier with generous limits
- Extremely fast inference (LLMs on LPU hardware)
- OpenAI-compatible API (easy fallback)
- No credit card required for demo/development

### Why Bun over pnpm/npm?

Bun provides:
- Workspace support out of the box
- Built-in TypeScript transpilation
- Faster installs (Rust-based resolver)
- Native `.env` loading
- Single tool for runtime, package manager, and bundler

---

## Presentation Talking Points

1. **Full-stack type safety**: Database schema → OpenAPI → TypeScript types → React components. Change the backend, regenerate types, frontend knows immediately.

2. **Real-time competition platform**: Not just CRUD — live match events, activity feeds, medal boards updating in real-time via SSE.

3. **AI-powered content**: Automated sports journalism, smart data population, all using production LLM APIs with graceful degradation.

4. **Complex domain modeling**: Multi-tenant leagues, delegation hierarchies, enrollment validation engines, bracket generation algorithms — all modeled cleanly.

5. **Production deployment**: Edge frontend (Cloudflare Workers) + managed backend (Railway) + automated CI type checking.

6. **Developer experience**: Monorepo with shared packages, hot reload for both frontend and backend, auto-generated API types, file-based routing.

---

*Document generated for university presentation and technical showcase.*

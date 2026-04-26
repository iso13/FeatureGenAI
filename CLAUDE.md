# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server with hot reload (port 5001)
npm run build         # Build frontend (Vite) + backend (esbuild) to dist/
npm run start         # Run production build
npm run check         # TypeScript type check

# Database
npm run db:push       # Apply Drizzle schema to the database

# Testing
npm test              # Run all tests (watch mode)
npm run test:run      # Run all tests once
npm run test:unit     # Unit tests only (tests/utils + tests/server)
npm run test:integration  # Integration tests
npm run test:components   # Component tests
npm run test:coverage     # Run with coverage report
npm test tests/server/    # Run a specific test folder

# Security
npm run security-check    # Run scripts/security-check.mjs
```

## Environment Variables

```
DATABASE_URL=postgresql://...    # Required. Neon or local PostgreSQL URL
OPENAI_API_KEY=...               # Required for complexity analysis + title suggestions
SESSION_SECRET=...               # Session signing secret (falls back to "dev-secret" in dev)
FEATUREGEN_FAKE_AI=1             # Skip real OpenAI calls; return deterministic stub responses
PORT=5001                        # Optional, defaults to 5001
```

## Architecture

### Request Flow
```
Browser → Express (port 5001)
         ├── /api/auth/*    → server/auth.ts (register, login, logout, /me)
         ├── /api/features  → server/routes.ts → server/storage.ts (PostgresStorage)
         ├── /api/analytics → server/routes.ts → storage
         ├── /api/users     → server/routes.ts (admin-only)
         └── /*             → Vite dev server (dev) or dist/public (prod)
```

### Key Architectural Decisions

**Feature generation is local-only** — `POST /api/features/generate` builds valid Gherkin using `buildLocalFeatureContent()` in `server/routes.ts`, not OpenAI. The `generateFeature()` function in `server/openai.ts` exists but is currently unused. OpenAI is called only for:
- Complexity analysis (`analyzeFeatureComplexity`) — called on generate and on edit
- Title suggestions (`suggestTitle`) — called from the home page

**Disabled features** — The schema has large sections commented out with `// DOMAIN DISABLED` and `// EPICS DISABLED`. Do not re-enable these without checking all callers. The `domain` and `epicId` columns still exist in the DB but are not used by the API.

**Shared schema** — `shared/schema.ts` is the single source of truth for all DB tables, Zod validation schemas, types, role constants, and permission maps. The `@shared` path alias resolves to this directory in both server and client.

**Storage abstraction** — `server/storage.ts` exports a `PostgresStorage` class that implements `IStorage`. All DB access goes through `storage` (singleton). The class uses `postgres` (direct driver) for queries and `drizzle-orm` for the query builder.

**Session storage** — Sessions are stored in PostgreSQL via `connect-pg-simple`. The session store table is created automatically. SSL is disabled for localhost connections.

### Frontend

- **Router**: `wouter` (not React Router). Routes defined in `client/src/App.tsx`.
- **Auth state**: `AuthProvider` / `useAuth()` hook wraps all routes. Unauthenticated users are redirected to `/auth`. The `/auth` route is the only public page.
- **Server state**: TanStack Query (`@tanstack/react-query`). All API calls go through query/mutation hooks.
- **Permissions**: `usePermissions()` hook (in `client/src/hooks/use-permissions.ts`) reads the current user's role and maps it to `ROLE_PERMISSIONS` from the schema.
- **UI components**: shadcn/ui components live in `client/src/components/ui/`. Custom non-shadcn components (`complexity-analysis-loader`, `feature-list`, `lifecycle-tracker`, etc.) also live there.
- **Theme**: dark/light via `ThemeProvider` wrapping the whole app. Theme key: `"feature-generator-theme"`.

### Roles & Permissions

Six roles defined in `shared/schema.ts`: `admin`, `product_manager`, `business_analyst`, `developer`, `tester`, `stakeholder`. Granular permissions are in `ROLE_PERMISSIONS`. `product_manager` requires admin approval on registration; all others are auto-approved. The `requireAuth` middleware checks `req.session.userId`; role checks are done inline in route handlers.

### Database Schema (active tables)

| Table | Purpose |
|---|---|
| `users` | Auth, roles, approval workflow |
| `password_reset_tokens` | Token-based password reset (1h expiry) |
| `features` | Gherkin feature files + lifecycle + complexity JSON |
| `analytics` | Generation events (success/failure) |
| `role_approval_requests` | Pending/approved/rejected role requests |

Features use soft delete (`deleted` boolean). Lifecycle stages: `draft → review → approved → implemented → tested → deployed`.

### Testing

Tests live in `tests/` with subdirectories `utils/`, `server/`, `components/`, `integration/`. Uses Vitest + jsdom + React Testing Library. Set `FEATUREGEN_FAKE_AI=1` to avoid real OpenAI calls in tests.

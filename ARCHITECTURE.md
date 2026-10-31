# Looply Architecture Specification

## 1. Architectural Philosophy

Looply is engineered as an enterprise-grade social media platform emphasizing:
1. **Decoupled Architecture:** Strict separation between the client presentation layer (`client/`) and the authoritative API backend (`server/`).
2. **Predictable Routing:** Centralized route definition (`client/lib/routes.js`) preventing hardcoded strings, broken references, or mismatched routes.
3. **Experience Isolation:** Clear structural boundaries between **Public/Auth**, **User Experience**, and **Admin Experience** via Next.js route groups and backend route trees.
4. **Authoritative Backend Security:** The backend is the sole authority for authentication, authorization, and data validation. Client-side state is treated strictly as an ephemeral projection.
5. **No Premature Complexity:** Development strictly honors the designated phase boundaries without speculative implementations or faux mocks.

---

## 2. System Architecture Diagram

```
+--------------------------------------------------------------------+
|                         CLIENT LAYER (Next.js)                     |
|                                                                    |
|  +------------------+  +-------------------+  +-----------------+  |
|  |  (public)/(auth) |  |       (user)      |  |     (admin)     |  |
|  |   Route Group    |  |    Route Group    |  |   Route Group   |  |
|  +------------------+  +-------------------+  +-----------------+  |
|           |                      |                      |          |
|           +----------------------+----------------------+          |
|                                  |                                 |
|                    Centralized Routes (lib/routes.js)              |
|                                  |                                 |
+----------------------------------+---------------------------------+
                                   | HTTP/REST (Strict CORS Origin)
                                   v
+--------------------------------------------------------------------+
|                         SERVER LAYER (Express.js)                  |
|                                                                    |
|  [src/server.js]  --> Server Startup & Graceful Termination        |
|          |                                                         |
|  [src/app.js]     --> App Initialization & Global Middleware       |
|          |                                                         |
|  [src/config/]    --> env.js (Environment), cors.js (Strict CORS)  |
|          |                                                         |
|  [src/routes/]    --> Root API router (/api)                       |
|          |            └── health.routes.js (/api/health)           |
|          |                                                         |
|  [src/controllers]--> health.controller.js                         |
|          |                                                         |
|  [src/middleware] --> error.middleware.js (404 & Global Handler)   |
|          |                                                         |
|  [src/models]     --> Domain Schemas (Phase 3+)                    |
|  [src/services]   --> Business Logic Layer (Phase 3+)              |
|  [src/validators] --> Schema Validation Layer (Phase 4+)           |
+--------------------------------------------------------------------+
```

---

## 3. Frontend Architecture (`client/`)

### 3.1 Technology Stack
- **Framework:** Next.js (App Router)
- **Language:** JavaScript (ES6+, JSX) - TypeScript is intentionally excluded.
- **Styling:** Tailwind CSS with CSS custom variables and theme tokens.

### 3.2 Directory Hierarchy
```text
client/
├── app/                  # Next.js App Router root
│   ├── (public)/         # Public experience route group (/, landing)
│   ├── (auth)/           # Authentication route group (/login, /register, etc.)
│   ├── (user)/           # User social experience route group (/feed, /profile, etc.)
│   ├── (admin)/          # Administrative oversight route group (/admin, etc.)
│   ├── layout.js         # Root HTML layout and viewport definition
│   └── globals.css       # Tailwind CSS import and global styles
├── components/           # Reusable UI component library
│   ├── brand/            # Brand marks, SVG logos, taglines
│   ├── layout/           # Shared layout components (Navbar, Footer, Shells)
│   └── status/           # System status cards and indicators
├── features/             # Domain-specific feature modules (deferred to future phases)
├── hooks/                # Custom reusable React hooks (deferred to future phases)
├── lib/                  # Shared utilities and configurations
│   └── routes.js         # Single source of truth for application URLs
├── services/             # Backend API client adapters (deferred to future phases)
└── public/               # Static assets (custom SVG favicon, brand logo)
```

### 3.3 Next.js App Router Grouping Strategy
Next.js route groups (`(...)`) allow modular layout inheritance without polluting URL paths:
- `(public)`: Provides landing page layouts. Accessible without authentication.
- `(auth)`: Provides centered, distraction-free layouts for login, registration, password recovery, and email verification.
- `(user)`: Encloses social feed, user profile, notifications, and AI assistant.
- `(admin)`: Completely segregated administrative layout with dark control panels, separate navigation hierarchy, and zero leakage into user views.

### 3.4 Route Management Policy
- **Rule:** Direct hardcoding of URLs within UI anchors or router pushes is prohibited.
- **Enforcement:** Every navigation destination must reference `ROUTES` from `@/lib/routes`.
- **Navigation:** All internal links use `next/link`. No dead buttons or actionless elements are allowed.

---

## 4. Backend Architecture (`server/`)

### 4.1 Technology Stack
- **Runtime:** Node.js (20.9+)
- **Module System:** ES Modules (`"type": "module"`)
- **Framework:** Express.js
- **CORS:** `cors` middleware with environment-governed origin validation
- **Environment:** `dotenv` with path resolution

### 4.2 Separation of Concerns
1. **Server Startup vs Application Initialization:**
   - `src/app.js` is pure application configuration: middleware setup, router mounting, and error handling. It does not call `app.listen()`, allowing unit and integration test runners (e.g., Supertest) to test endpoints without port binding conflicts.
   - `src/server.js` imports `app` and `env`, binds to `PORT`, logs runtime metadata, and registers OS termination signals (`SIGTERM`, `SIGINT`) for graceful shutdown.
2. **Environment Configuration (`src/config/env.js`):**
   - Centralizes all environment reading with fallback values.
   - Prevents unvalidated runtime accesses to `process.env`.
3. **Restricted CORS Policy (`src/config/cors.js`):**
   - Wildcard origins (`*`) are disallowed.
   - Origins are checked against `env.CLIENT_ORIGINS` / `env.CLIENT_ORIGIN` (supports single origin or comma-delimited list).
   - Requests without an Origin header (such as curl, mobile clients, or internal tools) are allowed in development only and strictly blocked in production with HTTP 403 Forbidden.
   - Unauthorized origins receive an explicit `403 Forbidden` response.
4. **Foundation Error Handling (`src/middleware/error.middleware.js`):**
   - `notFoundHandler`: Catches unhandled routes and returns standard JSON:
     ```json
     { "success": false, "message": "Resource not found: GET /unknown" }
     ```
   - `errorHandler`: Global Express 4-parameter error handler. Returns sanitized JSON error objects and includes stack traces only in development environments.

---

## 5. Security & Isolation Principles

1. **Authoritative Authorization:** Frontend guards and route groups provide UX guidance only. All security enforcement resides in backend middleware.
2. **Role Segregation:** Administrative endpoints will be gated behind verified token claims and database role checks. User and Admin routes share no common API controllers.
3. **Zero Secret Leakage:**
   - `.env` files containing credentials are excluded from version control via `.gitignore`.
   - `.env.example` templates document variable keys without exposing live secrets.

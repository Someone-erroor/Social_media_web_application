# Looply Architecture Specification

## 1. Architectural Philosophy

Looply is engineered as an enterprise-grade social media platform ("Connect. Share. Express.") emphasizing:
1. **Decoupled Architecture:** Strict separation between the client presentation layer (`client/`) and the authoritative API backend (`server/`).
2. **Predictable Routing:** Centralized route definition (`client/lib/routes.js`) preventing hardcoded strings, broken references, or mismatched routes.
3. **Experience Isolation:** Clear structural boundaries between **Public/Auth**, **User Experience**, and **Admin Experience** via Next.js route groups and layout shells.
4. **Authoritative Backend Security:** The backend is the sole authority for authentication, authorization, and data validation. Client-side state is treated strictly as an ephemeral projection.
5. **No Premature Complexity:** Development strictly honors designated phase boundaries without speculative implementations or faux mocks.
6. **Component Reusability:** Small, modular, composable UI building blocks with clear single responsibilities.

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
|      [PublicShell]          [UserShell]           [AdminShell]     |
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
- **Framework:** Next.js (App Router, Turbopack)
- **Language:** JavaScript (ES6+, JSX) - TypeScript is intentionally excluded.
- **Styling:** Tailwind CSS v4 with modern token-driven styling and consistent font stacks.
- **Brand System:** Modular SVG brand mark (`Logo.js`), custom vector iconography (`Icon.js`).

### 3.2 Design System Tokens & Brand Identity
- **Tagline:** Connect. Share. Express.
- **Color Palette:**
  - **Primary:** Indigo (`indigo-600`, `indigo-700`, `indigo-500`) and Violet accents.
  - **Neutrals:** Soft neutral canvas (`bg-slate-50`, `bg-slate-100`), crisp white card containers (`bg-white`).
  - **Typography:** Dark slate (`text-slate-900`) for primary headings, muted slate (`text-slate-500`) for body/secondary text.
  - **Borders & Elevation:** Subtle borders (`border-slate-200/80`), gentle elevation (`shadow-xs`, `shadow-sm`).
  - **Admin Canvas:** Deep slate navigation (`bg-slate-900`, `text-slate-200`) providing high contrast and visual distinction from user spaces.

### 3.3 Reusable Component Architecture (`client/components/`)
```text
client/components/
├── brand/
│   └── Logo.js            # Modular brand mark, tagline, size variants, dark/light variants
├── ui/
│   ├── Button.js          # Button & Next.js Link variants (primary, secondary, outline, ghost, danger)
│   ├── Input.js           # Styled form inputs with focus rings, icons, and error boundaries
│   ├── Card.js            # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
│   ├── Avatar.js          # Neutral fallback avatar with initials or silhouette icon
│   ├── Badge.js           # Status and category badges (neutral, primary, success, warning, danger)
│   ├── Icon.js            # Standardized 24x24 SVG iconography library
│   ├── EmptyState.js      # Honest, authentic empty states with icons, descriptions, and action slots
│   └── PageHeader.js      # Standardized title, description, badge, and action bar
├── forms/
│   └── FormField.js       # Accessible labeled form input wrapper with error and helper messaging
├── navigation/
│   ├── PublicNavbar.js    # Responsive top header with desktop links and mobile drawer
│   ├── PublicFooter.js    # Semantic footer with brand links, status pill, and copyright
│   ├── UserSidebar.js     # Desktop user navigation sidebar (logo links strictly to /feed)
│   ├── UserHeader.js      # Top header with search placeholder, notifications, and profile teaser
│   ├── UserBottomNav.js   # Mobile fixed bottom navigation bar (<768px)
│   ├── AdminSidebar.js    # Dark management sidebar with admin branding (links to /admin)
│   └── AdminHeader.js     # Admin workspace header with breadcrumb and clearance status
└── layouts/
    ├── UserShell.js       # Desktop 3-column layout (sidebar, main content, right context panel) + mobile nav
    └── AdminShell.js      # Distinct high-contrast administrative workspace
```

### 3.4 Experience Segregation & Layout Shells
1. **Public Experience:**
   - Pure product landing page at `/` featuring responsive navigation (`PublicNavbar`), Hero, feature highlights, workflow walkthrough, CTA banners, and footer (`PublicFooter`).
   - The old development `PhaseStatusCard` is completely removed.
2. **Authentication Experience:**
   - Dedicated centered layout (`app/(auth)/layout.js`) wrapping `/login`, `/register`, `/verify-email`, `/forgot-password`, and `/reset-password`.
   - Submissions are disabled with informative phase badges.
3. **User Social Experience:**
   - Rendered within `UserShell` (`app/(user)/layout.js`).
   - Desktop: 3-column architecture (Left navigation rail, center feed/content column `max-w-2xl`, right contextual panel `w-80` with topic discovery and guidelines).
   - Mobile: Top `UserHeader`, responsive single column, bottom fixed `UserBottomNav`.
   - Inside user experience, clicking the brand mark navigates to `/feed`.
4. **Administrator Experience:**
   - Rendered within `AdminShell` (`app/(admin)/layout.js`).
   - Completely isolated navigation hierarchy with dark sidebar (`AdminSidebar`), top status bar (`AdminHeader`), and management content area.
   - Clicking admin brand mark navigates to `/admin`.

---

## 4. Backend Architecture (`server/`)

### 4.1 Modular Structure
- Decoupled `app.js` (Express configuration, middleware, and routers) from `server.js` (HTTP process listening, database connection orchestration, and shutdown handlers).
- Robust environment validation (`config/env.js`) enforcing `NODE_ENV` (`development`, `production`, `test`), `PORT` (1–65535), `CLIENT_ORIGIN` URL validation, and `MONGODB_URI` handling.
- Strict CORS policy (`config/cors.js`):
  - In `development` & `test`: Requests without `Origin` (curl, unit tests, scripts) are allowed.
  - In `production`: Requests without `Origin` are strictly rejected with HTTP 403 Forbidden.
  - Configured frontend origins are strictly whitelisted across all environments.

### 4.2 Database Foundation & Mongoose Integration (Phase 3)
- **Centralized Connection Manager (`config/database.js`):**
  - Manages connection lifecycle with duplicate connection protection (`readyState` checks).
  - Masks credentials in all logs (`sanitizeMongoUri`) preventing credential leakage.
  - Monitors connection events (`connected`, `error`, `disconnected`).
  - Ensures HTTP listener does not accept requests before database connection is established.
  - Graceful shutdown handles SIGINT/SIGTERM by closing HTTP connections and disconnecting Mongoose cleanly.
- **Health Probes:**
  - `GET /api/health` — Process liveness probe (HTTP 200).
  - `GET /api/health/ready` — Database readiness probe (HTTP 200 when connected, HTTP 503 when disconnected).
- **Mongoose Data Models (`models/`):**
  - `User`: Members and admins with lowercase unique email and hidden `passwordHash` (`select: false`).
  - `Post`: Publications with content length boundaries and chronological/author compound indexes.
  - `Comment`: Discussion replies tied to Post and User with `{ post: 1, createdAt: -1 }` index.
  - `Like`: User reactions enforcing one like per user per post via `{ post: 1, user: 1 }` unique compound index.
  - `Notification`: In-app alerts supporting login alerts, likes, comments, and broadcasts with unread compound index.
  - `ActivityLog`: Immutable security audit ledger with automated credential leakage validation.
- Complete documentation: [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) and [`docs/ER_DIAGRAM.md`](./docs/ER_DIAGRAM.md).

---

## 5. Responsiveness & Accessibility Strategy

### Responsiveness
All layouts and components are verified across target viewport widths:
- **360px & 390px (Mobile):** Single column, touch-friendly targets (min 44px), top header, fixed bottom navigation, collapsible mobile menu drawers.
- **768px (Tablet):** Compact sidebar, responsive tables with horizontal overflow handling, responsive grids.
- **1024px (Laptop):** Full sidebar, multi-column cards, flexible content width.
- **1440px (Desktop):** Complete 3-column user layout including right-hand contextual exploration panel.

### Accessibility (a11y)
- Semantic HTML tags: `<header>`, `<nav>`, `<aside>`, `<main>`, `<footer>`, `<form>`, `<label>`, `<button>`, `<table>`.
- Accessible form fields using `htmlFor` and `id` bindings with `aria-describedby` and `aria-invalid`.
- Keyboard navigation supported with visible focus rings (`focus:ring-2 focus:ring-indigo-500`).
- No actionless clickable divs; semantic anchors (`<Link>`) or `<button>` elements are used throughout.
- Color contrast compliant with WCAG standards on both light and dark surfaces.

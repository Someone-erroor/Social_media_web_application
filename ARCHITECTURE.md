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

```text
+-----------------------------------------------------------------------------------------+
|                                CLIENT LAYER (Next.js)                                   |
|                                                                                         |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|  |  (public)/(auth)   |  |        (user)        |  |             (admin)             |  |
|  |    Route Group     |  |     Route Group      |  |           Route Group           |  |
|  +--------------------+  +----------------------+  +---------------------------------+  |
|            |                         |                               |                  |
|       [PublicShell]             [UserShell]                    [AdminShell]             |
|            |                         |                               |                  |
|            +-------------------------+-------------------------------+                  |
|                                      |                                                  |
|                        Centralized Routes (lib/routes.js)                               |
|                                      |                                                  |
+--------------------------------------+--------------------------------------------------+
                                       | HTTP/REST (Strict CORS Origin & Credentials)
                                       v
+-----------------------------------------------------------------------------------------+
|                                SERVER LAYER (Express.js)                                |
|                                                                                         |
|  [src/server.js]    --> Server Process, Port Listener, Graceful Shutdown                |
|           |                                                                             |
|  [src/app.js]       --> Express App, Global Middleware (CORS, Cookie Parser, JSON)      |
|           |                                                                             |
|  [src/config/]      --> env.js, cors.js, database.js, jwt.js                            |
|           |                                                                             |
|  [src/routes/]      --> Root API Router (/api)                                          |
|           ├── health.routes.js       --> GET /api/health, GET /api/health/ready         |
|           ├── auth.routes.js         --> POST register, login, logout, verify, reset, me|
|           ├── profile.routes.js      --> GET/PATCH /api/profile/me, GET /api/profiles/:id|
|           ├── post.routes.js         --> CRUD /api/posts, like/unlike, post comments     |
|           ├── comment.routes.js      --> PATCH/DELETE /api/comments/:commentId           |
|           ├── feed.routes.js         --> GET /api/feed, GET /api/explore                |
|           ├── admin.routes.js        --> Admin stats, activity, users, posts, comments   |
|           ├── notification.routes.js --> GET/read /api/notifications, unread count      |
|           └── ai.routes.js           --> POST /api/ai/posts/generate, /ai/posts/improve  |
|           |                                                                             |
|  [src/middleware]   --> auth.middleware.js (requireAuth, requireRole, optionalAuth)     |
|                     --> error.middleware.js (404 Not Found & Global Error Handler)      |
|           |                                                                             |
|  [src/validators]   --> auth, profile, post, comment, ai validators                     |
|           |                                                                             |
|  [src/controllers]  --> auth, profile, post, like, comment, admin, notification, ai     |
|           |                                                                             |
|  [src/services/]    --> auth.service.js         (Registration, JWT, login alerts)       |
|                     --> email.service.js        (Nodemailer SMTP & test outbox)         |
|                     --> post.service.js         (Post CRUD, enriched counters, feeds)   |
|                     --> like.service.js         (Like toggle, idempotency, alerts)      |
|                     --> comment.service.js      (Comment CRUD, ownership checks)        |
|                     --> admin.service.js        (Platform metrics, user/post/comment mod)|
|                     --> notification.service.js (Alert list, unread counts, read-all)   |
|                     --> socket.service.js       (Socket.IO server, JWT handshake, rooms)|
|                     --> ai.service.js           (Google Gemini AI via @google/genai)    |
|           |                                                                             |
|  [Database Services]--> config/database.js (Mongoose connection pool & event monitoring)|
|  [src/models/]      --> User, Post, Comment, Like, Notification, ActivityLog Schemas    |
+-----------------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------------+
|                                DATA PERSISTENCE LAYER                                   |
|                                                                                         |
|  [MongoDB Atlas]    --> Primary Replica Set Cluster (looply)                            |
|  [Isolated Test DB] --> Dedicated Automated Test Database (looply_test)                 |
+-----------------------------------------------------------------------------------------+
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

### 4.3 Authentication Architecture & Session Security (Phase 4)
- **Centralized Auth Configuration (`config/jwt.js`):**
  - High-entropy secret key validation (`JWT_SECRET` minimum 32 characters in production).
  - Standardized expiration (`JWT_EXPIRES_IN`, default 7 days).
  - HTTP-only cookie configuration: `httpOnly: true`, `secure: env.isProduction`, `sameSite: env.isProduction ? 'none' : 'lax'`, `path: '/'`.
  - Cookie clearance on logout using identical path, sameSite, and security attributes.
- **Password Security:**
  - Salted hashing via `bcryptjs` (12 rounds).
  - Plaintext passwords never stored or logged.
  - `passwordHash` strictly excluded from Mongoose query projections (`select: false`) and filtered from all API responses.
- **Role Escalation Protection:**
  - Registration strictly assigns `role: 'user'`, ignoring or rejecting client-supplied role values.
  - Administrative accounts are created solely through authorized database administration.
- **Authentication Endpoints:**
  - `POST /api/auth/register` — Validates inputs, checks duplicate email (HTTP 409), creates user with bcrypt hash, logs audit event, returns safe user (HTTP 201).
  - `POST /api/auth/login` — Validates credentials, verifies account active status, issues JWT in HTTP-only cookie, logs audit event, returns safe user (HTTP 200).
  - `GET /api/auth/me` — Protected by `authenticate` middleware, verifies JWT cookie, queries fresh user data from MongoDB, returns safe profile (HTTP 200).
  - `POST /api/auth/logout` — Clears HTTP-only session cookie (HTTP 200).
- **Frontend State Management (`client/context/AuthContext.js`):**
  - Automatic session restoration on initial mount via `GET /api/auth/me`.
  - Global `user`, `loading`, `isAuthenticated` state with `login`, `register`, `logout` actions.
  - Reusable API client (`client/services/api.js`) sending `credentials: 'include'` on all requests.
  - Post-login navigation: User role redirects to `/feed`; Admin role redirects to `/admin`.

### 4.4 Email Verification & Password Recovery (Phase 5)
- **SMTP Transport & Templating (`services/email.service.js`, `services/email-template.service.js`):**
  - Modular Nodemailer integration configured via `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
  - Professional, responsive HTML templates with inline styles and plain-text fallback alternatives.
  - Application starts safely without SMTP credentials in development/test.
  - **SMTP Integration & Delivery Status:**
    - SMTP integration is fully implemented in the backend via Nodemailer.
    - A development/test in-memory mail outbox (`testMailOutbox`) is available and used for all automated tests without external network dependencies.
    - Real SMTP outbound delivery requires manual configuration of valid third-party credentials in `server/.env`.
    - Real email delivery has not been claimed without actual SMTP configuration; automated tests verify cryptographic tokens and dispatch logic using the test outbox.
  - Never logs or exposes raw verification or reset tokens in logs or responses.
- **Email Verification Workflow:**
  - Registration generates high-entropy random token (`crypto.randomBytes(32)`).
  - Only the 64-character SHA-256 token digest is stored in MongoDB (`select: false`).
  - Raw token sent via email with 24-hour expiration.
  - `POST /api/auth/verify-email` validates token, marks `isEmailVerified: true`, and clears token records.
  - Single-use guarantee: token cannot be reused after verification.
  - Resend verification endpoint (`POST /api/auth/resend-verification`) uses generic response avoiding user enumeration.
  - Unverified users are strictly blocked from logging in (HTTP 403 Forbidden).
- **Password Recovery Workflow:**
  - `POST /api/auth/forgot-password` generates SHA-256 hashed reset token with 30-minute expiration.
  - Always returns generic success response regardless of email existence to prevent user enumeration.
  - `POST /api/auth/reset-password` validates token, verifies expiration, hashes new password with bcrypt (12 rounds), clears token, and increments `tokenVersion` to invalidate active sessions.

### 4.5 Authorization Security & RBAC (Phase 6)
- **Authoritative Middleware (`middleware/auth.middleware.js`):**
  - `requireAuth`: Verifies JWT signature and expiration, retrieves user from MongoDB, verifies `accountStatus !== 'suspended'`, validates `tokenVersion` matches database, and attaches authoritative user to `req.user`.
  - `requireRole`: Parameterized middleware enforcing required role clearance (e.g. `requireRole('admin')`). Database role is authoritative; client-supplied role parameters are rejected.
- **Session Invalidation (`tokenVersion`):**
  - JWT payload encodes `tokenVersion`.
  - Password reset increments `tokenVersion` in database, causing prior JWTs to be immediately rejected on subsequent requests (HTTP 401).
- **Route Protection Architecture:**
  - Backend: Admin routes (`/api/admin/*`) require `requireAuth` + `requireRole('admin')`.
  - Frontend: `UserShell` redirects unauthenticated users to `/login`. `AdminShell` redirects unauthenticated users to `/login` and non-admin users to `/feed`, displaying loading states without content flashing.
- **Initial Administrator Provisioning:**
  - No public administrator registration endpoint exists.
  - An authorized database operator promotes an existing verified user using:
    `db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })`.

### 4.6 User Profile Architecture (Phase 7)
- **Endpoints:**
  - `GET /api/profile/me`: Private endpoint returning full authenticated user profile.
  - `PATCH /api/profile/me`: Validates and updates `fullName` (2–70 chars), `bio` (max 250 chars), and `avatarUrl` (valid HTTP/HTTPS URL). Rejects modification of `role`, `email`, `passwordHash`, or account status.
  - `GET /api/profiles/:userId`: Public profile endpoint returning `fullName`, `profile: { bio, avatarUrl }`, and `createdAt`. Strictly excludes email and credentials.
- **Frontend Integration:**
  - Dedicated pages: `/profile` (overview and personal posts), `/profile/edit` (form editor), `/profile/[userId]` (public creator view), `/settings` (account credentials and preferences).

### 4.7 Post Management Architecture (Phase 8)
- **Domain Modeling & Referential Integrity (`models/Post.js`):**
  - Schema defines `author` (`ObjectId` ref to `User`), `content` (1–1000 characters), and timestamps.
  - Global feed index: `{ createdAt: -1 }`.
  - Creator timeline index: `{ author: 1, createdAt: -1 }`.
- **Endpoints & Access Controls:**
  - `POST /api/posts`: Requires authentication and verified email. Automatically binds `req.user._id` as author.
  - `GET /api/posts/mine`: Paginated list of current user's posts.
  - `GET /api/posts/:postId`: Single post lookup with author population.
  - `PATCH /api/posts/:postId`: Content update. Author ownership strictly verified; unauthorized attempts return HTTP 403 Forbidden.
  - `DELETE /api/posts/:postId`: Deletion with cascading cleanup of associated comments and likes. Author ownership strictly verified.
- **Frontend Components:**
  - `PostComposer`: Client component with character counter, validation, and optimistic feed update callback.
  - `PostCard`: Responsive publication card with inline author-only editing, delete confirmation dialog, and relative timestamp formatting.

### 4.8 Social Media Feed & Explore Architecture (Phase 9)
- **Feed Engine (`services/post.service.js`):**
  - `GET /api/feed?page=1&limit=10`: Returns global feed ordered chronologically (`createdAt: -1`). Populates safe author fields (`fullName`, `profile.avatarUrl`). Includes pagination metadata (`total`, `page`, `limit`, `totalPages`).
  - `GET /api/profiles/:userId/posts`: Timeline endpoint retrieving posts authored by a specific user.
  - `GET /api/explore`: Discovery stream for recent public discussions.
- **Frontend UI:**
  - `/feed`: Infinite or paginated stream with `PostComposer`, `PostCard` list, loading skeletons, and empty state.
  - `/explore`: Discovery view with topic tags and recent creator discussions.

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

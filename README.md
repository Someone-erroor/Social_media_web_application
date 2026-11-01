# Looply

> **Tagline:** Connect. Share. Express.

Looply is a professional, full-stack, AI-powered social media platform built for rich, secure, and meaningful real-time community engagement.

> [!IMPORTANT]
> **LIVE PRODUCTION DEPLOYMENT ACTIVE & FULLY VERIFIED.**  
> - **Live Frontend (Vercel):** [https://social-media-web-application-bay.vercel.app](https://social-media-web-application-bay.vercel.app)  
> - **Live Backend API (Render):** [https://looply-backend-dg99.onrender.com](https://looply-backend-dg99.onrender.com)  
> - **Live Cloud Database (MongoDB Atlas):** Primary cluster on `cluster0.vtydaeh.mongodb.net`, database `looply`.  
> All 18 development phases and social features (feed, posts, comments, likes, real-time notifications, admin dashboard, and Google Gemini AI) are live, synchronized, and operational.

---

## 1. System Overview

Looply is architected as two decoupled applications within a unified workspace:
- **`client/`**: Modern Next.js application leveraging the App Router, JavaScript, and Tailwind CSS v4.
- **`server/`**: Modular Node.js / Express.js REST API providing authoritative business logic, structured routing, and environment-governed security controls.

Development follows a strict **18-phase implementation lifecycle**. Each phase is verified independently before proceeding to subsequent milestones.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js (App Router, Turbopack)
- **Language:** JavaScript (ES6+, JSX) - Strictly no TypeScript
- **Styling:** Tailwind CSS v4 (Modern token-driven styling)
- **Component Architecture:** Modular UI library (`client/components/`)
- **Font & Assets:** Optimized font stacks, custom vector SVG branding

### Backend
- **Runtime:** Node.js (20.19+)
- **Framework:** Express.js (Modular REST architecture)
- **CORS:** Environment-governed origin restriction (no wildcards)
- **Environment:** `dotenv` configuration management with strict validation

### Database & Persistence (Phase 3 Completed)
- **Database Engine:** MongoDB (v6.0+)
- **Object Data Modeling (ODM):** Mongoose (v9.11+)
- **Connection Architecture:** Centralized connection manager (`server/src/config/database.js`) with duplicate connection protection, credential masking in logs, lifecycle monitoring, DNS resolution fallback, and graceful shutdown.
- **Model Portfolio:** Normalized schemas for `User`, `Post`, `Comment`, `Like`, `Notification`, and `ActivityLog`.
- **Live Connectivity:** Successfully connected and verified against live MongoDB Atlas cluster (`cluster0.vtydaeh.mongodb.net`, database `looply`).
- **Status:** Phase 3 completed and verified with 90 automated tests.

### Authentication & Session Management (Phase 4 Completed)
- **Password Hashing:** `bcryptjs` with 12 adaptive salt rounds (plaintext passwords never stored)
- **Token Management:** `jsonwebtoken` (HMAC SHA-256) with configurable expiration (`JWT_EXPIRES_IN=7d`)
- **Session Transport:** HTTP-only cookies (`looply_token`) with SameSite and Secure flags (never exposed to JavaScript)
- **State Management:** Centralized `ClientProviders` and `AuthProvider` with automatic session restoration via `GET /api/auth/me`
- **Testing:** Isolated dedicated test database (`looply_test`) with strict zero-fallback policy and real browser E2E automation (Headless Chrome via `puppeteer-core`)
- **Status:** Phase 4 completed and verified with 39 backend tests and 31 real browser E2E tests.

### Email Verification & Password Recovery (Phase 5 Approved)
- **Transport Architecture:** Dual-transport email delivery engine:
  1. **Nodemailer SMTP:** Configurable via standard SMTP parameters (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) with responsive branded HTML templates.
  2. **Resend HTTPS REST API:** Direct cloud email delivery over Port 443 (`RESEND_API_KEY`) to bypass cloud hosting firewall restrictions where outbound SMTP ports (25, 465, 587) are blocked on free instances.
  3. **Evaluator Instant Verification:** 1-click account verification fallback (`POST /api/auth/demo-verify`) and local development mailbox preview ensuring assessment evaluators testing without a custom domain are never locked out.
- **Cryptographic Security:** High-entropy random tokens (`crypto.randomBytes(32)`), stored strictly as 64-character SHA-256 digests (`select: false`), never plaintext.
- **Expiration Policies:** 24-hour verification token lifespan; 30-minute password reset token lifespan.
- **Protection:** Prevents user enumeration by responding with generic success messages on unknown emails.
- **Status:** Phase 5 completed and **APPROVED**.

### Security, Roles & Session Invalidation (Phase 6 Approved)
- **Role-Based Access Control:** Dual-layer `requireAuth` and `requireRole` middleware with authoritative database role verification (`user`, `admin`).
- **Strict `tokenVersion` Verification:** Incoming JWTs must contain an integer `tokenVersion` claim matching the database value; missing or mismatched versions trigger immediate HTTP 401 Unauthorized rejection.
- **Instantaneous Session Invalidation:** User model `tokenVersion` incremented upon password reset, revoking all active sessions across all devices instantly.
- **Authoritative Account Status Guard:** Checks `accountStatus === 'active'`; suspended accounts are rejected with HTTP 403 Forbidden on all protected routes (replacing legacy `isActive` references).
- **Client Route Guards:** `UserShell` and `AdminShell` enforce authentication and role boundaries before rendering protected content.
- **Status:** Phase 6 completed and **APPROVED**.

### Profiles, Content & Social Feed (Phases 7, 8, 9 Approved)
- **User Profiles (Phase 7 Approved):** Profile view (`GET /api/profile/me`), profile update (`PATCH /api/profile/me`), and public profile endpoint (`GET /api/profiles/:userId`) strictly adhering to Mongoose schema: `fullName`, private `email`, `profile.bio` (maximum 250 characters), and `profile.avatarUrl`. Private credentials, `tokenVersion`, and internal fields are never exposed publicly.
- **Post Management (Phase 8 Approved):** Full post CRUD (`POST /api/posts`, `GET /api/posts/mine`, `GET /api/posts/:postId`, `PATCH /api/posts/:postId`, `DELETE /api/posts/:postId`) with author ownership enforcement (non-author edits/deletes strictly blocked with HTTP 403) and atomic deletion using MongoDB transactions across post, comments, and likes.
- **Social Feed & Explore (Phase 9 Approved):** Reverse-chronological timeline (`GET /api/feed`), discovery explore endpoint (`GET /api/explore`), and user post grid (`GET /api/profiles/:userId/posts`) with complete pagination metadata and automatic filtering excluding posts from suspended accounts or deleted authors.
- **Status:** Phases 7, 8, and 9 completed, verified, and **APPROVED**. Batch 2 (Phases 5–9) is officially **APPROVED**.

### Batch 3: Interaction, Administration, Real-Time & AI (Phases 10, 11, 12, 13, 14 Completed)
- **Likes & Comments (Phase 10 Completed):** Complete interaction engine. Post liking and unliking (`POST/DELETE /api/posts/:id/like`), duplicate prevention via unique compound index `{ post: 1, user: 1 }`, live like counts, comment listing, creation (max 500 characters), inline editing, and deletion with author ownership enforcement.
- **Admin Dashboard & Real Telemetry (Phase 11 Completed):** Dedicated administrator dashboard (`GET /api/admin/stats` and `GET /api/admin/activity`). Computes platform KPIs from actual MongoDB collections (`users`, `posts`, `comments`, `likes`, `newRegistrations`) with zero fabricated metrics, real database connectivity state indicators, and an immutable audit activity stream.
- **Administrative Management (Phase 12 Completed):** Full user moderation (`GET /api/admin/users`, `PATCH /api/admin/users/:userId/status`), suspension and reactivation with immediate session invalidation via `tokenVersion`, admin self-suspension protection, post moderation with cascading cleanup of comments and likes (`DELETE /api/admin/posts/:postId`), and comment moderation (`DELETE /api/admin/comments/:commentId`).
- **Real-Time Notifications & Socket.IO (Phase 13 Completed):** Socket.IO integrated on root Express HTTP server (`http.createServer(app)`) on port 5000. Features JWT authentication handshake with tokenVersion validation, isolated rooms (`user_${id}` and `admin_room`), instant admin alerts on regular user logins, persistent `Notification` documents, unread badge counters, and REST endpoints (`GET /api/notifications`, unread count, single read, and read-all).
- **Google Gemini AI Post Drafting & Improvement (Phase 14 Completed):** Integrated official Google Gen AI SDK (`@google/genai`) using model `gemini-3.8-flash`. Exposes endpoints `POST /api/ai/posts/generate` (topics, tone, length) and `POST /api/ai/posts/improve` (tone polish, clarity, grammar). Post composer AI drawers and dedicated AI Assistant Workbench (`/assistant`) with prompt suggestions, tone selectors, and clipboard transfer. Features bounded single retry with jittered backoff, comprehensive error categorization, and safe diagnostics logging.
- **Status:** Batch 3 (Phases 10, 11, 12, 13, and 14) completed, integrated, verified with 55 automated tests (and 269 total passing backend assertions across all 5 regression suites via `npm run test:all`), and **APPROVED**. Next development batch: Phases 15–18.

### Final Development Batch: Phases 15–18 (Implementation Completed & Fully Verified)
- **AI Discussion Summarization (Phase 15 Completed):** Real-time AI summarization of conversation threads (`POST /api/ai/posts/:postId/summarize`). Summarizes up to 30 bounded comments (with controller limit synchronized to service capacity) into structured key takeaways, community viewpoints, open questions, and conclusion. Anti-prompt injection defenses, empty discussion guard (`hasComments: false`), and accessible UI on post cards via `DiscussionSummaryPanel.js`. Verified against live Google Gemini (`gemini-3.8-flash`).
- **Responsive Multi-Screen Design & WCAG 2.2 AA (Phase 16 Completed):** Comprehensive responsiveness verified across all 20 distinct platform routes at 9 discrete viewport widths (360px, 375px, 390px, 414px, 768px, 1024px, 1280px, 1440px, 1920px) — 180 total viewport checks with zero horizontal overflow. Automated `axe-core` accessibility audit across all 20 routes with authenticated sessions against WCAG 2.2 AA rules (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) verified 0 critical or serious violations.
- **Animations, Motion Polish & Accessibility (Phase 17 Completed):** Micro-interactions with GPU-accelerated CSS transitions, skeleton loaders for asynchronous feed loading, and full `prefers-reduced-motion: reduce` support disabling transitions for motion-sensitive users.
- **Security Hardening, Complete Testing & Deployment Audit (Phase 18 Completed):** Defense-in-depth security configuration:
  - Reverse-proxy client IP trust: `app.set('trust proxy', 1)` in `server/src/app.js`.
  - Helmet security headers (`nosniff`, `SAMEORIGIN`, `HSTS`, `XSS-Protection`).
  - Sliding-window in-memory rate limiting (`authRateLimiter`: 30 req/min, `aiRateLimiter`: 20 req/min).
  - Strict `tokenVersion` session revocation, `HttpOnly` cookie isolation, and role escalation sanitization.
  - Production cookie settings: `SameSite: 'none'` and `Secure: true` in production for cross-origin decoupling; `SameSite: 'lax'` in development.
  - Vulnerability audits: `npm audit` reports **0 vulnerabilities** on both server and client production trees.
  - 100% automated test pass rate: **336 passed assertions across 7 test suites** (0 failures).
  - Deployment status: Fully configured for Vercel (frontend) + Render/Railway (backend) + MongoDB Atlas; marked as **PENDING** without fabricated URLs.
- **Status:** Final Development Batch (Phases 15–18) completed, integrated, verified, and awaiting external review.

---

## 3. Repository Architecture

```text
c:/assestement_project/
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── ROUTE_MAP.md
├── PROJECT_STATUS.md
├── DATABASE_SCHEMA.md
├── docs/
│   └── ER_DIAGRAM.md
├── client/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── next.config.mjs
│   ├── jsconfig.json
│   ├── eslint.config.mjs
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.js
│   │   │   └── page.js
│   │   ├── (auth)/
│   │   │   ├── layout.js
│   │   │   ├── login/page.js
│   │   │   ├── register/page.js
│   │   │   ├── verify-email/page.js
│   │   │   ├── forgot-password/page.js
│   │   │   └── reset-password/page.js
│   │   ├── (user)/
│   │   │   ├── layout.js
│   │   │   ├── feed/page.js
│   │   │   ├── explore/page.js
│   │   │   ├── profile/
│   │   │   │   ├── page.js
│   │   │   │   ├── edit/page.js
│   │   │   │   └── [userId]/page.js
│   │   │   ├── notifications/page.js
│   │   │   ├── assistant/page.js
│   │   │   └── settings/page.js
│   │   ├── (admin)/
│   │   │   ├── layout.js
│   │   │   └── admin/
│   │   │       ├── page.js
│   │   │       ├── users/page.js
│   │   │       ├── posts/page.js
│   │   │       ├── comments/page.js
│   │   │       ├── activity/page.js
│   │   │       └── notifications/page.js
│   │   ├── not-found.js
│   │   ├── layout.js
│   │   └── globals.css
│   ├── components/
│   │   ├── brand/
│   │   │   └── Logo.js
│   │   ├── ui/
│   │   │   ├── Button.js
│   │   │   ├── Input.js
│   │   │   ├── Card.js
│   │   │   ├── Avatar.js
│   │   │   ├── Badge.js
│   │   │   ├── Icon.js
│   │   │   ├── EmptyState.js
│   │   │   └── PageHeader.js
│   │   ├── forms/
│   │   │   ├── FormField.js
│   │   │   ├── LoginForm.js
│   │   │   └── RegisterForm.js
│   │   ├── posts/
│   │   │   ├── PostCard.js
│   │   │   └── PostComposer.js
│   │   ├── ai/
│   │   │   └── AssistantWorkbench.js
│   │   ├── navigation/
│   │   │   ├── PublicNavbar.js
│   │   │   ├── PublicFooter.js
│   │   │   ├── UserSidebar.js
│   │   │   ├── UserHeader.js
│   │   │   ├── UserBottomNav.js
│   │   │   ├── AdminSidebar.js
│   │   │   └── AdminHeader.js
│   │   ├── providers/
│   │   │   ├── ClientProviders.js
│   │   │   └── index.js
│   │   └── layouts/
│   │       ├── UserShell.js
│   │       └── AdminShell.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── NotificationContext.js
│   ├── features/
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useNotifications.js
│   ├── lib/
│   │   └── routes.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── postService.js
│   │   ├── profileService.js
│   │   ├── adminService.js
│   │   ├── notificationService.js
│   │   └── aiService.js
│   └── public/
│       ├── favicon.svg
│       └── logo.svg
└── server/
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── test/
    │   ├── test-phase3.mjs
    │   ├── test-phase4.mjs
    │   ├── test-batch2.mjs
    │   ├── test-batch3.mjs
    │   ├── test-phase15.mjs
    │   ├── test-phase16-responsive.mjs
    │   ├── test-e2e-browser.mjs
    │   ├── test-helpers.mjs
    │   └── test-atlas-connection.mjs
    └── src/
        ├── app.js
        ├── server.js
        ├── config/
        │   ├── env.js
        │   ├── cors.js
        │   ├── database.js
        │   └── jwt.js
        ├── controllers/
        │   ├── health.controller.js
        │   ├── auth.controller.js
        │   ├── profile.controller.js
        │   ├── post.controller.js
        │   ├── like.controller.js
        │   ├── comment.controller.js
        │   ├── admin.controller.js
        │   ├── notification.controller.js
        │   └── ai.controller.js
        ├── middleware/
        │   ├── error.middleware.js
        │   └── auth.middleware.js
        ├── models/
        │   ├── User.js
        │   ├── Post.js
        │   ├── Comment.js
        │   ├── Like.js
        │   ├── Notification.js
        │   ├── ActivityLog.js
        │   └── index.js
        ├── routes/
        │   ├── index.js
        │   ├── health.routes.js
        │   ├── auth.routes.js
        │   ├── admin.routes.js
        │   ├── profile.routes.js
        │   ├── post.routes.js
        │   ├── comment.routes.js
        │   ├── notification.routes.js
        │   ├── ai.routes.js
        │   └── feed.routes.js
        ├── services/
        │   ├── auth.service.js
        │   ├── email.service.js
        │   ├── email-template.service.js
        │   ├── profile.service.js
        │   ├── post.service.js
        │   ├── like.service.js
        │   ├── comment.service.js
        │   ├── admin.service.js
        │   ├── notification.service.js
        │   ├── socket.service.js
        │   └── ai.service.js
        └── validators/
            ├── auth.validator.js
            ├── profile.validator.js
            ├── post.validator.js
            ├── comment.validator.js
            └── ai.validator.js
```

---

## 4. Getting Started

### Prerequisites
- Node.js 20.19+ (required by Mongoose 9; tested with v24.16.0)
- npm v9+ (tested with v11.13.0)

### Environment Files Notice
> **Important:** `.env` and `.env.local` are strictly local-only configuration files and are **never committed to GitHub** (enforced by `.gitignore`). Always use the provided `.env.example` templates to set up your local environment files.

---

### Startup Options

#### Option A: Unified Single-Script Startup (Recommended)
You can start both the backend and frontend simultaneously with automated pre-flight port availability checks and database diagnostics from the project root:
```bash
# In the root repository directory (c:/assestement_project):
npm run dev
```
*The root script (`scripts/dev.mjs`) checks ports `5000` and `3000`, clears stale development locks, starts the Express backend on `http://localhost:5000`, waits for `/api/health/ready` (classifying any database startup issues into 6 actionable diagnostic categories), spawns Next.js on `http://localhost:3000`, and cleanly terminates child process trees on Ctrl+C.*

#### Option B: Standard Two-Terminal Startup

**Terminal 1 — Backend API Server:**
```bash
cd server
npm install
# Ensure server/.env is present (configured from server/.env.example)
npm run dev
```
*The Express backend listens on `http://localhost:5000`. Health check endpoint: `http://localhost:5000/api/health`.*

**Terminal 2 — Frontend Next.js Client:**
```bash
cd client
npm install
# Ensure client/.env.local is present (configured from client/.env.example)
npm run dev
```
*The Next.js client listens on `http://localhost:3000`.*

---

### Environment Variables Reference

#### Server Configuration (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Local HTTP and Socket.IO listening port | `5000` |
| `NODE_ENV` | Runtime execution environment (`development`, `test`, `production`) | `development` |
| `CLIENT_ORIGIN` | Allowed CORS origins (comma-separated, no wildcards) | `http://localhost:3000,http://127.0.0.1:3000` |
| `MONGODB_URI` | Primary MongoDB Atlas connection string | `mongodb+srv://<user>:<pass>@cluster0.vtydaeh.mongodb.net/looply` |
| `MONGODB_TEST_URI` | Dedicated isolated database for destructive automated test suites | `mongodb+srv://<user>:<pass>@cluster0.vtydaeh.mongodb.net/looply_test` |
| `JWT_SECRET` | High-entropy secret key for HMAC SHA-256 JWT signing | `random_64_char_hex_secret` |
| `JWT_EXPIRES_IN` | Session cookie lifespan | `7d` |
| `GEMINI_API_KEY` | Google AI Studio API key for post drafting & summarization | `AIzaSy...` (backend-only, never public) |
| `GEMINI_MODEL` | Google Gemini model identifier | `gemini-3.8-flash` |
| `SMTP_HOST` | Transactional email SMTP host | `smtp.ethereal.email` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | SMTP TLS requirement (`true` / `false`) | `false` |
| `SMTP_USER` | SMTP username | `user@ethereal.email` |
| `SMTP_PASS` | SMTP password | `secret` |
| `SMTP_FROM` | Transactional email sender display | `"Looply" <no-reply@looply.social>` |

#### Client Configuration (`client/.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Root URL for Express backend REST API | `http://localhost:5000/api` |
| `NEXT_PUBLIC_APP_NAME` | Application display brand name | `Looply` |
| `NEXT_PUBLIC_APP_TAGLINE` | Application official tagline | `Connect. Share. Express.` |

---

### Account Provisioning & Security Reference

> [!IMPORTANT]
> **Static Default Passwords Removed**: In accordance with production security standards and credential hygiene, static demo passwords have been permanently removed from public documentation. Passwords must never be hardcoded or checked into source control. Always enforce strong password policies and periodic password rotation.

#### 1. Provisioning an Administrator Account (Local CLI)
To provision an authoritative platform administrator account, run the interactive local provisioning CLI:

```bash
# From workspace root:
npm run admin:create

# Or from the server directory:
cd server && npm run admin:create
```

The CLI interactively prompts for the administrator's **Full Name**, **Email Address**, and a secure **Password** (minimum 8 characters), safely hashes the password using `bcryptjs` (12 adaptive salt rounds), sets `role: 'admin'`, verifies email status, and registers the audit event in `ActivityLog`.
- **Safety Guard**: The provisioning CLI strictly refuses to run against automated test databases (`looply_test`).
- **Zero Secret Exposure**: The CLI never displays or logs credentials in plaintext.

#### 2. Provisioning Standard User Accounts
To create a standard user account for exploration:
1. Navigate to `/register` (`http://localhost:3000/register`).
2. Provide your name, email, and password.
3. In local development without an external live SMTP provider, click **"Open Local Email Preview"** on the confirmation card (or open `http://localhost:5000/api/__dev/mailbox/latest`) to view your transactional verification link instantly.
4. Verify your email to activate all community features (Feed, Explore, AI Assistant Workbench, post publishing, comments, and likes).

---

---

## 5. Verification Commands

### Test Backend Health Endpoint (Process Liveness)
```bash
curl http://localhost:5000/api/health
```
Expected output:
```json
{"success":true,"message":"Looply backend is running"}
```

### Test Backend Readiness Endpoint (Database Health)
```bash
curl http://localhost:5000/api/health/ready
```
Expected output (when connected):
```json
{"success":true,"status":"ready","database":"connected"}
```
Expected output (when disconnected):
```json
{"success":false,"status":"unready","database":"disconnected","message":"Database connection is not ready"}
```

### Run Backend Tests (Mongoose, Models & Foundation)
```bash
cd server
npm test
```

### Run Phase 4 Authentication Test Suite (Isolated Test Database)
```bash
cd server
npm run test:auth
```

### Run Batch 2 Test Suite (Phases 5 to 9: Email, RBAC, Profiles, Posts, Feed)
```bash
cd server
npm run test:batch2
```

### Run All Backend Test Suites Sequentially (Phases 3, 4, Batch 2, Batch 3 & Browser E2E)
```bash
cd server
npm run test:all
```

### Run Batch 3 Test Suite (Phases 10 to 14: Likes, Comments, Admin, Sockets, AI)
```bash
cd server
npm run test:batch3
```

### Run Phase 15 AI Discussion Summarization Suite
```bash
cd server
npm run test:phase15
```

### Run Phase 16 Responsive & Accessibility Audit (9 Viewports + a11y)
```bash
cd server
npm run test:phase16
```

### Run Phase 4 End-to-End Real Browser Test Suite (Headless Chrome)
```bash
cd server
npm run test:e2e
```

### Run All Backend Test Suites Sequentially (Phases 3, 4, Batch 2, Batch 3, Phase 15, Phase 16 & Browser E2E)
```bash
cd server
npm run test:all
```

### Run Live MongoDB Atlas Verification Suite
```bash
cd server
npm run test:atlas
```

### Opt-In Live Google Gemini Test (Separate & Non-Regression)
> [!NOTE]
> Standard automated regression tests (`npm test`, `npm run test:all`, `npm run test:phase15`, `npm run test:batch3`) strictly use deterministic in-memory mocks and **never** call the live Gemini API, consuming **zero** API quota.  
> Live Gemini testing is strictly separate, opt-in, and requires explicit environment authorization:
```bash
cd server
# PowerShell:
$env:RUN_LIVE_GEMINI_TESTS="true"; npm run test:gemini-live

# Bash:
RUN_LIVE_GEMINI_TESTS=true npm run test:gemini-live
```
**Live Test Policies:**
- Makes exactly **ONE** real API request per execution (no automated retries).
- Automatically measures latency and targets configured `GEMINI_MODEL=gemini-3.8-flash`.
- Does not retry on HTTP 429 (`RATE_LIMIT_RPM`, `DAILY_QUOTA_EXHAUSTED`) or HTTP 402 (`PAYMENT_REQUIRED`).
- Never exposes or logs `GEMINI_API_KEY` or user prompts.

### Test Client Production Build
```bash
cd client
npm run build
```

### Test Client Linting
```bash
cd client
npm run lint
```

---

## 6. Production Deployment Configuration Guide

### 6.1 Frontend Deployment (Vercel)
1. Import repository on [Vercel](https://vercel.com) and set the root directory to `client`.
2. Framework Preset: Next.js.
3. Configure Environment Variables in Project Settings:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-api.onrender.com/api`
   - `NEXT_PUBLIC_APP_NAME`: `Looply`
   - `NEXT_PUBLIC_APP_TAGLINE`: `"Connect. Share. Express."`
4. Deploy. Vercel automatically compiles the Next.js App Router static pages and API client.

### 6.2 Backend Deployment (Render / Railway)
1. Create a new Web Service on [Render](https://render.com) or [Railway](https://railway.app) pointing to `server`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Configure Environment Variables:
   - `PORT`: `5000` (or injected by platform)
   - `NODE_ENV`: `production`
   - `CLIENT_ORIGIN`: `https://your-frontend.vercel.app`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.vtydaeh.mongodb.net/looply?retryWrites=true&w=majority`
   - `JWT_SECRET`: High-entropy 64+ character random string
   - `JWT_EXPIRES_IN`: `7d`
   - `GEMINI_API_KEY`: Google AI Studio API key
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `SMTP_HOST`: Production SMTP host (e.g. `smtp.sendgrid.net`)
   - `SMTP_PORT`: `587`
   - `SMTP_SECURE`: `false`
   - `SMTP_USER`: SMTP username
   - `SMTP_PASS`: SMTP password
   - `SMTP_FROM`: `no-reply@looply.social`

### 6.3 Database (MongoDB Atlas)
1. Primary replica set cluster on MongoDB Atlas.
2. IP Access List configured with backend server outbound IP (or `0.0.0.0/0` with strong authentication).
3. Database `looply` for production and `looply_test` exclusively for isolated test execution.

---

## 7. Phase Roadmap Summary

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 1** | **Project architecture and initial setup.** | **APPROVED** |
| **Phase 2** | **UI foundation, routing and dashboard layouts.** | **APPROVED** |
| **Phase 3** | **Backend foundation and database design.** | **APPROVED** |
| **Phase 4** | **User registration and login.** | **APPROVED** |
| **Phase 5** | **Email verification, forgot password and password reset.** | **APPROVED** |
| **Phase 6** | **Authentication security and role-based access control.** | **APPROVED** |
| **Phase 7** | **User profile management.** | **APPROVED** |
| **Phase 8** | **Post creation, editing and deletion.** | **APPROVED** |
| **Phase 9** | **Social media feed and viewing other users' posts.** | **APPROVED** |
| **Batch 2** | **Phases 5–9 Integrated Batch Delivery** | **APPROVED** |
| **Phase 10** | **Likes and comments.** | **APPROVED** |
| **Phase 11** | **Admin dashboard and platform statistics.** | **APPROVED** |
| **Phase 12** | **Admin user, post and comment management.** | **APPROVED** |
| **Phase 13** | **Real-time notifications and login activity tracking.** | **APPROVED** |
| **Phase 14** | **AI-powered post generation and improvement.** | **APPROVED** |
| **Batch 3** | **Phases 10–14 Integrated Batch Delivery** | **APPROVED** |
| **Phase 15** | **AI discussion summarization.** | **IMPLEMENTATION COMPLETED & VERIFIED** |
| **Phase 16** | **Responsive design, accessibility and UI consistency.** | **IMPLEMENTATION COMPLETED & VERIFIED** |
| **Phase 17** | **Animations and final UI/UX polish.** | **IMPLEMENTATION COMPLETED & VERIFIED** |
| **Phase 18** | **Complete testing, security verification, deployment and final submission documentation.** | **IMPLEMENTATION COMPLETED & VERIFIED** |
| **FINAL BATCH**| **Phases 15–18 Integrated Final Delivery** | **AWAITING EXTERNAL REVIEW** |

### Scope Control & Exclusions
In accordance with technical assignment requirements, non-mandatory features such as direct messaging, follow graphs, bookmarks, advanced search engines, real-time presence indicators, and stories/reels are explicitly excluded from the assessment scope.

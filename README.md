# Looply

> **Tagline:** Connect. Share. Express.

Looply is a professional, full-stack, AI-powered social media platform built for rich, secure, and meaningful real-time community engagement.

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

### Email Verification & Password Recovery (Phase 5 Completed)
- **Transport Architecture:** `nodemailer` with dynamic SMTP configuration (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) and graceful mock/fallback handling.
- **Cryptographic Security:** High-entropy random tokens (`crypto.randomBytes(32)`), stored strictly as 64-character SHA-256 digests (`select: false`), never plaintext.
- **Expiration Policies:** 24-hour verification token lifespan; 30-minute password reset token lifespan.
- **Protection:** Prevents user enumeration by responding with generic success messages on unknown emails.
- **Status:** Phase 5 completed and verified.

### Security, Roles & Session Invalidation (Phase 6 Completed)
- **Role-Based Access Control:** Dual-layer `requireAuth` and `requireRole` middleware with authoritative database role verification (`user`, `admin`).
- **Instantaneous Session Invalidation:** User model `tokenVersion` incremented upon password reset, revoking all active sessions across all devices instantly.
- **Lifecycle Guards:** Suspended or deleted user accounts immediately rejected on all protected routes.
- **Client Route Guards:** `UserShell` and `AdminShell` enforce authentication and role boundaries before rendering protected content.
- **Status:** Phase 6 completed and verified.

### Profiles, Content & Social Feed (Phases 7, 8, 9 Completed)
- **User Profiles (Phase 7):** Profile view (`GET /api/profile/me`), profile update (`PATCH /api/profile/me`), and public profile endpoint (`GET /api/profiles/:userId`) strictly adhering to Mongoose schema: `fullName`, `profile.bio` (maximum 250 characters), and `profile.avatarUrl`. Private email, `passwordHash`, verification tokens, and `tokenVersion` are never exposed publicly.
- **Post Management (Phase 8):** Full post CRUD (`POST /api/posts`, `GET /api/posts/mine`, `GET /api/posts/:postId`, `PATCH /api/posts/:postId`, `DELETE /api/posts/:postId`) with author ownership enforcement (non-author edits/deletes strictly blocked with HTTP 403) and atomic deletion using MongoDB transactions across post, comments, and likes.
- **Social Feed & Explore (Phase 9):** Reverse-chronological timeline (`GET /api/feed`), discovery explore endpoint (`GET /api/explore`), and user post grid (`GET /api/profiles/:userId/posts`) with complete pagination metadata and automatic filtering excluding posts from suspended accounts or deleted authors.
- **Status:** Phases 7, 8, and 9 completed, verified, and final corrections applied.

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
│   │   └── AuthContext.js
│   ├── features/
│   ├── hooks/
│   │   └── useAuth.js
│   ├── lib/
│   │   └── routes.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── postService.js
│   │   └── profileService.js
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
        │   └── post.controller.js
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
        │   └── feed.routes.js
        ├── services/
        │   ├── auth.service.js
        │   ├── email.service.js
        │   ├── email-template.service.js
        │   ├── profile.service.js
        │   └── post.service.js
        └── validators/
            ├── auth.validator.js
            ├── profile.validator.js
            └── post.validator.js
```

---

## 4. Getting Started

### Prerequisites
- Node.js 20.19+ (required by Mongoose 9; tested with v24.16.0)
- npm v9+ (tested with v11.13.0)

### Environment Files Notice
> **Important:** `.env` and `.env.local` are strictly local-only configuration files and are **never committed to GitHub** (enforced by `.gitignore`). Always use the provided `.env.example` templates to set up your local environment files.

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize environment variables (`.env` is a local-only file and not committed to GitHub):
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The server starts on port `5000`. Health check endpoint: `http://localhost:5000/api/health`.*

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize environment variables (`.env.local` is a local-only file and not committed to GitHub):
   ```bash
   cp .env.example .env.local
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The client opens at `http://localhost:3000`.*

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

### Run Phase 4 End-to-End Real Browser Test Suite (Headless Chrome)
```bash
cd server
npm run test:e2e
```

### Run Live MongoDB Atlas Verification Suite
```bash
cd server
npm run test:atlas
```

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

## 6. Phase Roadmap Summary

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 1** | **Project architecture and initial setup.** | **APPROVED** |
| **Phase 2** | **UI foundation, routing and dashboard layouts.** | **APPROVED** |
| **Phase 3** | **Backend foundation and database design.** | **APPROVED** |
| **Phase 4** | **User registration and login.** | **APPROVED** |
| **Phase 5** | **Email verification, forgot password and password reset.** | **IMPLEMENTATION COMPLETED** |
| **Phase 6** | **Authentication security and role-based access control.** | **IMPLEMENTATION COMPLETED** |
| **Phase 7** | **User profile management.** | **IMPLEMENTATION COMPLETED** |
| **Phase 8** | **Post creation, editing and deletion.** | **IMPLEMENTATION COMPLETED** |
| **Phase 9** | **Social media feed and viewing other users' posts.** | **IMPLEMENTATION COMPLETED** |
| **Batch 2** | **Phases 5–9 Integrated Batch Delivery** | **IMPLEMENTATION COMPLETED<br>FINAL CORRECTIONS APPLIED<br>AWAITING EXTERNAL REVIEW** |
| **Phase 10** | Likes and comments. | **PENDING** |
| Phase 11 | Admin dashboard and platform statistics. | Pending |
| Phase 12 | Admin user, post and comment management. | Pending |
| Phase 13 | Real-time notifications and login activity tracking. | Pending |
| Phase 14 | AI-powered post generation and improvement. | Pending |
| Phase 15 | AI discussion summarization. | Pending |
| Phase 16 | Responsive design, accessibility and UI consistency. | Pending |
| Phase 17 | Animations and final UI/UX polish. | Pending |
| Phase 18 | Complete testing, security verification, deployment and final submission documentation. | Pending |

### Scope Control & Exclusions
In accordance with technical assignment requirements, non-mandatory features such as direct messaging, follow graphs, bookmarks, advanced search engines, real-time presence indicators, and stories/reels are explicitly excluded from the assessment scope.

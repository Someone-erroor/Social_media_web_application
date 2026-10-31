# Looply Route Map & Routing Architecture

This document establishes the official routing architecture for the **Looply** platform ("Connect. Share. Express.") across all three target experiences: **Public**, **User**, and **Admin**.

All application links and programmatic navigation conform to this document and reference the centralized route dictionary (`client/lib/routes.js`).

---

## 1. Route Inventory & Implementation Status

All 20 application routes are fully implemented, verified, and mapped to centralized constants in `client/lib/routes.js`.

### 1.1 Public & Authentication Routes
These routes are accessible to unauthenticated visitors and prospective members.

| Target URL | Experience Scope | Route Group File Path | Layout Shell | Status |
| :--- | :---: | :--- | :--- | :---: |
| `/` | Public | `client/app/(public)/page.js` | `PublicNavbar` + `PublicFooter` | Implemented (Phase 2) |
| `/login` | Auth | `client/app/(auth)/login/page.js` | `AuthLayout` (Centered Card) | **Active (Phase 4)** &bull; Real API Connected |
| `/register` | Auth | `client/app/(auth)/register/page.js` | `AuthLayout` (Centered Card) | **Active (Phase 4)** &bull; Real API Connected |
| `/verify-email` | Auth | `client/app/(auth)/verify-email/page.js` | `AuthLayout` (Centered Card) | **Active (Phase 5)** &bull; Real Verification & Resend Connected |
| `/forgot-password` | Auth | `client/app/(auth)/forgot-password/page.js`| `AuthLayout` (Centered Card) | **Active (Phase 5)** &bull; Real Password Recovery Connected |
| `/reset-password` | Auth | `client/app/(auth)/reset-password/page.js` | `AuthLayout` (Centered Card) | **Active (Phase 5)** &bull; Real Reset Execution Connected |

### 1.2 User Experience Routes
These routes render within the responsive `UserShell` (3-column layout on desktop, top `UserHeader` and bottom `UserBottomNav` on mobile). Protected by client-side session guard (unauthenticated requests redirect to `/login`). Inside the user experience, clicking the brand logo navigates to `/feed`.

| Target URL | Experience Scope | Route Group File Path | Layout Shell | Status |
| :--- | :---: | :--- | :--- | :---: |
| `/feed` | User | `client/app/(user)/feed/page.js` | `UserShell` (3-Column) | **Active (Phase 8–9)** &bull; Real Feed & Composer Connected |
| `/explore` | User | `client/app/(user)/explore/page.js` | `UserShell` (3-Column) | **Active (Phase 9)** &bull; Real Discovery Posts Connected |
| `/profile` | User | `client/app/(user)/profile/page.js` | `UserShell` (3-Column) | **Active (Phase 7)** &bull; Real Profile & Post List Connected |
| `/profile/edit` | User | `client/app/(user)/profile/edit/page.js` | `UserShell` (3-Column) | **Active (Phase 7)** &bull; Real Profile Editor Connected |
| `/profile/[userId]`| User | `client/app/(user)/profile/[userId]/page.js` | `UserShell` (3-Column) | **Active (Phase 7 & 9)** &bull; Real Public Profile & Timeline |
| `/notifications` | User | `client/app/(user)/notifications/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/assistant` | User | `client/app/(user)/assistant/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/settings` | User | `client/app/(user)/settings/page.js` | `UserShell` (3-Column) | **Active (Phase 7)** &bull; Real Account Settings Connected |

### 1.3 Administrator Experience Routes
These routes render within the distinct, high-contrast `AdminShell` (`AdminSidebar` + `AdminHeader`), completely isolated from the user application experience. Protected by client-side RBAC guard (unauthenticated users redirect to `/login`, non-admin users redirect to `/feed`).

| Target URL | Experience Scope | Route Group File Path | Layout Shell | Status |
| :--- | :---: | :--- | :--- | :---: |
| `/admin` | Admin | `client/app/(admin)/admin/page.js` | `AdminShell` (Management) | **Protected (Phase 6)** &bull; Admin Clearance Enforced |
| `/admin/users` | Admin | `client/app/(admin)/admin/users/page.js` | `AdminShell` (Management) | **Protected (Phase 6)** &bull; Admin Clearance Enforced |
| `/admin/posts` | Admin | `client/app/(admin)/admin/posts/page.js` | `AdminShell` (Management) | **Protected (Phase 6)** &bull; Admin Clearance Enforced |
| `/admin/comments` | Admin | `client/app/(admin)/admin/comments/page.js`| `AdminShell` (Management) | **Protected (Phase 6)** &bull; Admin Clearance Enforced |
| `/admin/activity` | Admin | `client/app/(admin)/admin/activity/page.js`| `AdminShell` (Management) | **Protected (Phase 6)** &bull; Admin Clearance Enforced |
| `/admin/notifications` | Admin | `client/app/(admin)/admin/notifications/page.js` | `AdminShell` (Management) | **Protected (Phase 6)** &bull; Admin Clearance Enforced |

### 1.4 Custom Error Routes
| Target URL | Route File Path | Purpose | Status |
| :--- | :--- | :--- | :---: |
| `/_not-found` (404) | `client/app/not-found.js` | Custom, accessible 404 error page | Implemented (Phase 2) |

### 1.5 Backend API Endpoint Inventory (Phases 1–9)
| Method | Endpoint | Access Level | Purpose | Phase |
| :--- | :--- | :---: | :--- | :---: |
| `GET` | `/api/health` | Public | Liveness probe returning backend operational status | Phase 1 |
| `GET` | `/api/health/ready` | Public | Readiness probe checking MongoDB Atlas connectivity | Phase 3 |
| `POST` | `/api/auth/register` | Public | Registers member with bcrypt hash, generates verification token | Phase 4 & 5 |
| `POST` | `/api/auth/verify-email` | Public | Validates verification token, activates account | Phase 5 |
| `POST` | `/api/auth/resend-verification` | Public | Re-dispatches verification email safely | Phase 5 |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, verifies active & email status | Phase 4 & 5 |
| `POST` | `/api/auth/forgot-password` | Public | Initiates password recovery email safely | Phase 5 |
| `POST` | `/api/auth/reset-password` | Public | Validates reset token, updates password, invalidates sessions | Phase 5 & 6 |
| `GET` | `/api/auth/me` | Authenticated | Validates session via `requireAuth`, returns safe user | Phase 4 & 6 |
| `POST` | `/api/auth/logout` | Authenticated/Public | Clears HTTP-only authentication cookie | Phase 4 |
| `GET` | `/api/admin/status` | Admin (`requireRole`) | Administrative security status endpoint | Phase 6 |
| `GET` | `/api/profile/me` | Authenticated | Retrieves current authenticated member profile | Phase 7 |
| `PATCH` | `/api/profile/me` | Authenticated | Updates display name, bio, and avatar URL | Phase 7 |
| `GET` | `/api/profiles/:userId` | Public | Retrieves public member profile | Phase 7 |
| `GET` | `/api/profiles/:userId/posts`| Public | Retrieves posts authored by specific user | Phase 9 |
| `POST` | `/api/posts` | Authenticated (Verified) | Publishes new post with automatic author binding | Phase 8 |
| `GET` | `/api/posts/mine` | Authenticated | Retrieves posts authored by current user | Phase 8 |
| `GET` | `/api/posts/:postId` | Public | Retrieves single post with author information | Phase 8 |
| `PATCH` | `/api/posts/:postId` | Authenticated (Author) | Updates post content (ownership strictly verified) | Phase 8 |
| `DELETE` | `/api/posts/:postId` | Authenticated (Author) | Deletes post and cascades comment/like cleanup | Phase 8 |
| `GET` | `/api/feed` | Authenticated | Chronological community feed (newest first) | Phase 9 |
| `GET` | `/api/feed/explore` | Public | Discovery stream for popular/recent posts | Phase 9 |
| `GET` | `/api/explore` | Public | Direct explore endpoint alias | Phase 9 |

---

## 2. Next.js App Router Structure & Grouping Rules

```text
client/app/
├── (public)/
│   ├── layout.js              --> Wraps public presentation views
│   └── page.js                --> Maps to: /
├── (auth)/
│   ├── layout.js              --> Wraps centered auth cards
│   ├── login/page.js          --> Maps to: /login
│   ├── register/page.js       --> Maps to: /register
│   ├── verify-email/page.js   --> Maps to: /verify-email
│   ├── forgot-password/page.js--> Maps to: /forgot-password
│   └── reset-password/page.js --> Maps to: /reset-password
├── (user)/
│   ├── layout.js              --> Wraps children in UserShell
│   ├── feed/page.js           --> Maps to: /feed
│   ├── explore/page.js        --> Maps to: /explore
│   ├── profile/
│   │   ├── page.js            --> Maps to: /profile
│   │   ├── edit/page.js       --> Maps to: /profile/edit
│   │   └── [userId]/page.js   --> Maps to: /profile/[userId]
│   ├── notifications/page.js  --> Maps to: /notifications
│   ├── assistant/page.js      --> Maps to: /assistant
│   └── settings/page.js       --> Maps to: /settings
├── (admin)/
│   ├── layout.js              --> Wraps children in AdminShell
│   └── admin/
│       ├── page.js            --> Maps to: /admin
│       ├── users/page.js      --> Maps to: /admin/users
│       ├── posts/page.js      --> Maps to: /admin/posts
│       ├── comments/page.js   --> Maps to: /admin/comments
│       ├── activity/page.js   --> Maps to: /admin/activity
│       └── notifications/page.js --> Maps to: /admin/notifications
├── not-found.js               --> Custom 404 page
├── layout.js                  --> Root HTML shell, fonts & viewport
└── globals.css                --> Tailwind CSS v4 styling tokens
```

### Route Group Rules
1. **Parentheses are Omitted from URLs:** Route groups `(public)`, `(auth)`, `(user)`, and `(admin)` isolate layout hierarchies without altering the resulting URL path.
   - `app/(user)/feed/page.js` maps cleanly to `/feed`.
   - `app/(admin)/admin/page.js` maps cleanly to `/admin`.
   - `app/(admin)/admin/users/page.js` maps cleanly to `/admin/users`.
2. **Layout Segregation:**
   - User navigation (`UserSidebar`, `UserHeader`, `UserBottomNav`) is confined strictly to `UserShell`.
   - Admin navigation (`AdminSidebar`, `AdminHeader`) is confined strictly to `AdminShell`.
   - No administrative components or route definitions leak into user layouts.
3. **Collision Avoidance:** No two route groups declare identical leaf paths that result in competing route definitions for the same URL.

---

## 3. Centralized Route Configuration Reference

All frontend navigation must consume routes via the centralized module `client/lib/routes.js`:

```javascript
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

// Public & Auth navigation:
<Link href={ROUTES.PUBLIC.HOME}>Home</Link>
<Link href={ROUTES.PUBLIC.LOGIN}>Sign In</Link>
<Link href={ROUTES.PUBLIC.REGISTER}>Register</Link>

// User navigation:
<Link href={ROUTES.USER.FEED}>Activity Feed</Link>
<Link href={ROUTES.USER.EXPLORE}>Explore</Link>
<Link href={ROUTES.USER.PROFILE}>Profile</Link>
<Link href={ROUTES.USER.USER_PROFILE(userId)}>View Profile</Link>

// Admin navigation:
<Link href={ROUTES.ADMIN.DASHBOARD}>Admin Portal</Link>
<Link href={ROUTES.ADMIN.USERS}>User Directory</Link>
```

---

## 4. Architectural Boundaries & Route Protection Policy

In strict adherence to the project roadmap and architecture principles, the routing security model is governed by the following specifications:

1. **Frontend Previews & Real Authentication:**
   User registration and login are fully implemented and connected to the backend API (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`) in **Phase 4**. Other future mutation views (post publishing, likes, comments, password reset API) remain in honest preview states until their designated phases.

2. **Real Authentication Implemented (Phase 4):**
   Real user registration with bcrypt password hashing, login with HTTP-only JWT cookies, automatic session restoration, and logout are functional in Phase 4. Tokens are strictly stored in HTTP-only cookies and never exposed in client JavaScript.

3. **Backend-Authoritative Route Protection (Phase 6):**
   Full route protection guards (redirecting unauthenticated users to `/login` or unauthorized users away from `/admin`) belong to **Phase 6: Authentication security and role-based access control**. In Phase 4, the backend authoritatively protects `/api/auth/me` with `authenticate` middleware, and frontend views consume the real session state.

4. **Frontend Route Groups are Organizational, Not Security Boundaries:**
   Next.js App Router route groups (`(public)`, `(auth)`, `(user)`, `(admin)`) are organizational constructs used for layout composition and clean code partitioning. Real authorization enforcement is handled authoritatively by the backend.

5. **Form Submissions & Mutating Operations:**
   All submission controls (login, registration, password recovery, profile editing, post publishing, and broadcast dispatch) are visibly disabled with clear indicator notes until their corresponding backend phases.

6. **Authentic Empty States:**
   No mock data, fake post streams, dummy followers, or fabricated admin metrics are rendered. All views display authentic empty states.

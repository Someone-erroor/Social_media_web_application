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
| `/login` | Auth | `client/app/(auth)/login/page.js` | `AuthLayout` (Centered Card) | Implemented (Phase 2) |
| `/register` | Auth | `client/app/(auth)/register/page.js` | `AuthLayout` (Centered Card) | Implemented (Phase 2) |
| `/verify-email` | Auth | `client/app/(auth)/verify-email/page.js` | `AuthLayout` (Centered Card) | Implemented (Phase 2) |
| `/forgot-password` | Auth | `client/app/(auth)/forgot-password/page.js`| `AuthLayout` (Centered Card) | Implemented (Phase 2) |
| `/reset-password` | Auth | `client/app/(auth)/reset-password/page.js` | `AuthLayout` (Centered Card) | Implemented (Phase 2) |

### 1.2 User Protected Routes
These routes render within the responsive `UserShell` (3-column layout on desktop, top `UserHeader` and bottom `UserBottomNav` on mobile). Inside the user experience, clicking the brand logo navigates to `/feed`.

| Target URL | Experience Scope | Route Group File Path | Layout Shell | Status |
| :--- | :---: | :--- | :--- | :---: |
| `/feed` | User | `client/app/(user)/feed/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/explore` | User | `client/app/(user)/explore/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/profile` | User | `client/app/(user)/profile/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/profile/edit` | User | `client/app/(user)/profile/edit/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/profile/[userId]`| User | `client/app/(user)/profile/[userId]/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/notifications` | User | `client/app/(user)/notifications/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/assistant` | User | `client/app/(user)/assistant/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |
| `/settings` | User | `client/app/(user)/settings/page.js` | `UserShell` (3-Column) | Implemented (Phase 2) |

### 1.3 Administrator Protected Routes
These routes render within the distinct, high-contrast `AdminShell` (`AdminSidebar` + `AdminHeader`), completely isolated from the user application experience.

| Target URL | Experience Scope | Route Group File Path | Layout Shell | Status |
| :--- | :---: | :--- | :--- | :---: |
| `/admin` | Admin | `client/app/(admin)/admin/page.js` | `AdminShell` (Management) | Implemented (Phase 2) |
| `/admin/users` | Admin | `client/app/(admin)/admin/users/page.js` | `AdminShell` (Management) | Implemented (Phase 2) |
| `/admin/posts` | Admin | `client/app/(admin)/admin/posts/page.js` | `AdminShell` (Management) | Implemented (Phase 2) |
| `/admin/comments` | Admin | `client/app/(admin)/admin/comments/page.js`| `AdminShell` (Management) | Implemented (Phase 2) |
| `/admin/activity` | Admin | `client/app/(admin)/admin/activity/page.js`| `AdminShell` (Management) | Implemented (Phase 2) |
| `/admin/notifications` | Admin | `client/app/(admin)/admin/notifications/page.js` | `AdminShell` (Management) | Implemented (Phase 2) |

### 1.4 Custom Error Routes
| Target URL | Route File Path | Purpose | Status |
| :--- | :--- | :--- | :---: |
| `/_not-found` (404) | `client/app/not-found.js` | Custom, accessible 404 error page | Implemented (Phase 2) |

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

## 4. Intentionally Deferred Functionality (Strict Phase Boundaries)

To ensure zero premature complexity and strict adherence to the 18-phase roadmap, the following features remain intentionally deferred:

1. **Authentication State & Guards:** Auth guards (redirecting unauthenticated users) belong to Phase 6. In Phase 2, direct URL navigation to all UI layouts is accessible for visual testing and pair review.
2. **Form Submissions:** All submit buttons on authentication and edit forms are visibly disabled with descriptive phase tooltips.
3. **Database & API Integration:** No MongoDB connection (Phase 3) or custom backend endpoints beyond Phase 1 `/api/health` are executed in Phase 2.
4. **Mock Data Prohibition:** All feeds, lists, tables, and statistics display authentic, professional empty states. No fake users, counts, or statistics are fabricated.

# Looply Route Map & Routing Architecture

This document establishes the official routing architecture for the **Looply** platform across all three target experiences: **Public**, **User**, and **Admin**.

All application links and programmatic navigation must conform to this document and reference the centralized route dictionary (`client/lib/routes.js`).

---

## 1. Route Inventory

### 1.1 Public & Authentication Routes
These routes are accessible to unauthenticated visitors and prospective members.

| Target URL | Experience Scope | Route Group Path | Purpose / Description |
| :--- | :--- | :--- | :--- |
| `/` | Public | `app/(public)/page.js` | Landing page & platform overview |
| `/login` | Auth | `app/(auth)/login/page.js` | User and administrator sign-in |
| `/register` | Auth | `app/(auth)/register/page.js` | New account onboarding |
| `/verify-email` | Auth | `app/(auth)/verify-email/page.js` | Verification token redemption |
| `/forgot-password` | Auth | `app/(auth)/forgot-password/page.js`| Password reset request form |
| `/reset-password` | Auth | `app/(auth)/reset-password/page.js` | New password establishment |

### 1.2 User Protected Routes
These routes require an authenticated user session. Layouts feature the standard user header, activity navigation, and social features.

| Target URL | Experience Scope | Route Group Path | Purpose / Description |
| :--- | :--- | :--- | :--- |
| `/feed` | User | `app/(user)/feed/page.js` | Social media activity feed |
| `/explore` | User | `app/(user)/explore/page.js` | Discover trending posts, tags, and users |
| `/profile` | User | `app/(user)/profile/page.js` | Authenticated member's own profile |
| `/profile/edit` | User | `app/(user)/profile/edit/page.js` | Profile information & avatar editor |
| `/profile/[userId]`| User | `app/(user)/profile/[userId]/page.js` | Public profile view for a specific member |
| `/notifications` | User | `app/(user)/notifications/page.js` | User notifications and activity alerts |
| `/assistant` | User | `app/(user)/assistant/page.js` | AI-assisted companion & helper |
| `/settings` | User | `app/(user)/settings/page.js` | Account preferences & security options |

### 1.3 Administrator Protected Routes
These routes require an active session with verified administrator credentials. They are completely separated from user navigation.

| Target URL | Experience Scope | Route Group Path | Purpose / Description |
| :--- | :--- | :--- | :--- |
| `/admin` | Admin | `app/(admin)/admin/page.js` | Administrator summary dashboard |
| `/admin/users` | Admin | `app/(admin)/admin/users/page.js` | User account directory & role management |
| `/admin/posts` | Admin | `app/(admin)/admin/posts/page.js` | Post review, flagging, and moderation |
| `/admin/comments` | Admin | `app/(admin)/admin/comments/page.js`| Comment review and moderation |
| `/admin/activity` | Admin | `app/(admin)/admin/activity/page.js`| Platform security & audit activity log |
| `/admin/notifications` | Admin | `app/(admin)/admin/notifications/page.js` | System security alerts and login notices |

---

## 2. Next.js App Router Structure & Grouping Rules

```text
client/app/
├── (public)/
│   ├── layout.js              --> Wraps public presentation views
│   └── page.js                --> Maps to: /
├── (auth)/
│   └── layout.js              --> Wraps auth cards and forms
├── (user)/
│   └── layout.js              --> Wraps social feed, profile & user shell
├── (admin)/
│   └── layout.js              --> Wraps administrative dark control panel
├── layout.js                  --> Root HTML shell, fonts & viewport
└── globals.css                --> Tailwind CSS styling tokens
```

### Route Group Rules
1. **Parentheses are Omitted from URLs:** Route groups `(public)`, `(auth)`, `(user)`, and `(admin)` group related routes into distinct layout hierarchies without altering the resulting URL path.
   - Example: `app/(user)/feed/page.js` maps cleanly to `/feed`.
   - Example: `app/(admin)/admin/users/page.js` maps cleanly to `/admin/users`.
2. **Layout Segregation:**
   - User navigation bars and feeds are confined to `(user)/layout.js`.
   - Admin control panels, sidebar rails, and audit links are confined to `(admin)/layout.js`.
   - No administrative components or route definitions are imported into the user layout.
3. **Collision Avoidance:** No two route groups may declare identical leaf paths that result in competing route definitions for the same URL.

---

## 3. Centralized Route Configuration Reference

All frontend navigation must consume routes via the centralized module `client/lib/routes.js`:

```javascript
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

// Example Navigation:
<Link href={ROUTES.PUBLIC.LOGIN}>Sign In</Link>
<Link href={ROUTES.USER.FEED}>Activity Feed</Link>
<Link href={ROUTES.USER.USER_PROFILE(targetUserId)}>View Profile</Link>
<Link href={ROUTES.ADMIN.DASHBOARD}>Admin Portal</Link>
```

---

## 4. Routing Integrity & Architectural Constraints

1. **Role-Based Redirects (Future Phase 2+):**
   - Post-authentication redirects will examine the verified backend role (e.g., standard users redirect to `/feed`, administrators redirect to `/admin`).
2. **Authoritative Backend Authorization:**
   - Client-side routing guards provide user convenience, but backend API routes are the authoritative gatekeepers. Unauthorized access attempts to `/admin/*` or `/api/admin/*` will be rejected by backend middleware with `403 Forbidden`.
3. **No Dead or Non-Functional Navigation:**
   - All interactive navigation elements must point to valid destinations. Visual mockup buttons without actions or destinations are prohibited.
4. **Session Persistence:**
   - Future authenticated state will persist across browser reloads via secure cookie/token mechanisms.
5. **Browser History Consistency:**
   - Navigation must preserve proper browser history stack behavior (Back / Forward navigation).

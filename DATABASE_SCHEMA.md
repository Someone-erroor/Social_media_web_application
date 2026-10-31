# Looply Database Schema Specification

> **Project:** Looply ("Connect. Share. Express.")  
> **Target Database:** MongoDB (v6.0+) via Mongoose ODM (v9.x)  
> **Phase Milestone:** Final Development Batch (Phases 15–18) — AI Discussion Summarization, Responsive WCAG 2.2 AA, Motion Polish & Full Security Verification  
> **Phase Status:** Phases 1–14: APPROVED | Phases 15–18: IMPLEMENTATION COMPLETED & FULLY VERIFIED (Awaiting External Review)  
> **Architecture:** Decoupled Express.js REST API (`server/`) with Mongoose Schemas  

---

## 1. Executive Summary & Design Principles

The Looply database layer is architected for scalability, referential integrity, query performance, and strict privacy. All schemas are declared in `server/src/models/` using Mongoose ES Modules and strictly isolate database operations from HTTP controllers.

### Core Architectural Principles
1. **Explicit Schema Enforcement:** Every document adheres to a declared Mongoose schema with strict data types, field validators, and enum guards.
2. **Normalized Referential Model:** Relational links between resources utilize MongoDB `ObjectId` references (`ref`) rather than unbounded embedded subdocuments, avoiding the 16MB BSON document limit.
3. **Compound & Unique Indexing:** Critical constraints (e.g. unique user emails, preventing duplicate likes) are enforced authoritatively at the database index level.
4. **Credential Isolation by Default:** Sensitive attributes such as `passwordHash` are marked with `select: false` to prevent accidental inclusion in query projections.
5. **Security in Audit Logs:** The `ActivityLog` model contains an active schema validator that programmatically rejects any metadata payload containing passwords, JWT tokens, or API secrets.

---

## 2. Collection & Schema Specifications

The Looply database consists of six core collections:

```
┌────────────────────────────────────────────────────────┐
│               Looply Database Collections              │
├──────────────────┬─────────────────┬───────────────────┤
│ Collection Name  │ Mongoose Model  │ File Path         │
├──────────────────┼─────────────────┼───────────────────┤
│ users            │ User            │ src/models/User.js│
│ posts            │ Post            │ src/models/Post.js│
│ comments         │ Comment         │ src/models/Comment.js
│ likes            │ Like            │ src/models/Like.js│
│ notifications    │ Notification    │ src/models/Notification.js
│ activitylogs     │ ActivityLog     │ src/models/ActivityLog.js
└──────────────────┴─────────────────┴───────────────────┘
```

---

### 2.1 User Collection (`users`)

Represents registered platform members and administrative accounts.

| Field Name | BSON Type | Required | Default | Modifiers & Validation Rules | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Generated | Unique primary identifier | System-generated MongoDB ID |
| `fullName` | `String` | **Yes** | — | `trim`, min: 2, max: 70 chars | User's public display name |
| `email` | `String` | **Yes** | — | `lowercase`, `trim`, unique index, regex | Unique contact and sign-in email |
| `passwordHash` | `String` | **Yes** | — | `select: false` (hidden by default) | bcryptjs with 12 salt rounds (never plaintext) |
| `role` | `String` | **Yes** | `'user'` | Enum: `['user', 'admin']` | Platform clearance role |
| `isEmailVerified`| `Boolean` | No | `false` | Boolean flag | Email ownership verification status |
| `profile.bio` | `String` | No | `''` | `trim`, max: 250 chars | Public member biographical summary |
| `profile.avatarUrl`| `String` | No | `''` | `trim` | Public avatar image asset URL |
| `accountStatus`| `String` | **Yes** | `'active'`| Enum: `['active', 'suspended']` | Account operational status |
| `verificationTokenHash` | `String` | No | — | `select: false` | SHA-256 hash of email verification token |
| `verificationTokenExpiresAt` | `Date` | No | — | `select: false` | Verification token expiration timestamp (24h) |
| `resetPasswordTokenHash` | `String` | No | — | `select: false` | SHA-256 hash of password reset token |
| `resetPasswordTokenExpiresAt` | `Date` | No | — | `select: false` | Password reset token expiration timestamp (30m) |
| `tokenVersion` | `Number` | No | `0` | Default: 0 | Session version counter for token invalidation |
| `createdAt` | `Date` | Auto | Timestamp | Managed by Mongoose `timestamps` | Account creation timestamp |
| `updatedAt` | `Date` | Auto | Timestamp | Managed by Mongoose `timestamps` | Last modification timestamp |

#### Indexes on `users`:
- `{ email: 1 }` (`unique: true`) — Exactly one unique index declared via field-level definition, enforcing email uniqueness across the platform and powering O(1) sign-in lookups.

---

### 2.2 Post Collection (`posts`)

Represents community publications, thoughts, and creator discussions.

| Field Name | BSON Type | Required | Default | Modifiers & Validation Rules | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Generated | Unique primary identifier | System-generated MongoDB ID |
| `author` | `ObjectId` | **Yes** | — | `ref: 'User'` | Reference to creating `User` |
| `content` | `String` | **Yes** | — | `trim`, min: 1, max: 1000 chars | Body content of the post |
| `createdAt` | `Date` | Auto | Timestamp | Managed by Mongoose `timestamps` | Post publication timestamp |
| `updatedAt` | `Date` | Auto | Timestamp | Managed by Mongoose `timestamps` | Last content update timestamp |

#### Indexes on `posts`:
- `{ createdAt: -1 }` — Powers chronological retrieval for the global community feed (`/feed`).
- `{ author: 1, createdAt: -1 }` — Compound index supporting creator profile timelines (`/profile/[userId]`).

---

### 2.3 Comment Collection (`comments`)

Represents discussion replies and feedback on published posts.

| Field Name | BSON Type | Required | Default | Modifiers & Validation Rules | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Generated | Unique primary identifier | System-generated MongoDB ID |
| `post` | `ObjectId` | **Yes** | — | `ref: 'Post'` | Reference to parent `Post` |
| `author` | `ObjectId` | **Yes** | — | `ref: 'User'` | Reference to author `User` |
| `content` | `String` | **Yes** | — | `trim`, min: 1, max: 500 chars | Reply text content |
| `createdAt` | `Date` | Auto | Timestamp | Managed by Mongoose `timestamps` | Comment publication timestamp |
| `updatedAt` | `Date` | Auto | Timestamp | Managed by Mongoose `timestamps` | Last modification timestamp |

#### Indexes on `comments`:
- `{ post: 1, createdAt: -1 }` — Compound index for paginated retrieval of discussion replies under a specific post.

---

### 2.4 Like Collection (`likes`)

Represents post appreciations by registered users. Enforces strict uniqueness to prevent duplicate reactions.

| Field Name | BSON Type | Required | Default | Modifiers & Validation Rules | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Generated | Unique primary identifier | System-generated MongoDB ID |
| `post` | `ObjectId` | **Yes** | — | `ref: 'Post'` | Target `Post` being liked |
| `user` | `ObjectId` | **Yes** | — | `ref: 'User'` | Registered `User` who liked the post |
| `createdAt` | `Date` | No | `Date.now` | Default timestamp | Interaction creation timestamp |

#### Indexes on `likes`:
- `{ post: 1, user: 1 }` (`unique: true`) — **Unique compound index**: guarantees that a user can like a specific post at most once. Rejects duplicate like attempts at the database storage engine layer.

---

### 2.5 Notification Collection (`notifications`)

Stores user activity alerts, login notifications, community interactions, and system broadcasts.

| Field Name | BSON Type | Required | Default | Modifiers & Validation Rules | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Generated | Unique primary identifier | System-generated MongoDB ID |
| `recipient` | `ObjectId` | **Yes** | — | `ref: 'User'` | User receiving the alert |
| `actor` | `ObjectId` | No | `null` | `ref: 'User'` | Optional initiating user (`null` for system) |
| `type` | `String` | **Yes** | — | Enum: `['login_alert', 'post_like', 'post_comment', 'system']` | Category of alert |
| `message` | `String` | **Yes** | — | `trim`, max: 300 chars | Renderable notification text |
| `resourceType`| `String` | No | `null` | Enum: `['Post', 'Comment', 'User', 'System', null]` | Associated entity model |
| `resourceId` | `ObjectId` | No | `null` | Reference identifier | Primary key of the referenced entity |
| `readAt` | `Date` | No | `null` | Nullable timestamp | Timestamp when viewed (`null` = unread) |
| `createdAt` | `Date` | No | `Date.now` | Default timestamp | Notification creation timestamp |

#### Indexes on `notifications`:
- `{ recipient: 1, createdAt: -1 }` — Powers user notification list sorted by newest first.
- `{ recipient: 1, readAt: 1 }` — Enables fast counting and filtering of unread alerts (`readAt: null`).

---

### 2.6 Activity Log Collection (`activitylogs`)

An immutable audit ledger tracking security checkpoints, content mutations, and administrative events.

| Field Name | BSON Type | Required | Default | Modifiers & Validation Rules | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto | Generated | Unique primary identifier | System-generated MongoDB ID |
| `actor` | `ObjectId` | No | `null` | `ref: 'User'` | Initiating user (`null` for system/visitor) |
| `action` | `String` | **Yes** | — | Enum: `['user_registration', 'email_verification', 'successful_login', 'password_reset_request', 'password_reset', 'password_reset_success', 'profile_update', 'post_creation', 'post_update', 'post_deletion', 'comment_creation', 'like_creation', 'admin_action']` | Audit action identifier |
| `targetType` | `String` | No | `null` | `trim` | Type of affected entity |
| `targetId` | `ObjectId` | No | `null` | Reference identifier | Primary key of affected entity |
| `metadata` | `Mixed` | No | `{}` | Programmatic security validator | Additional context (no credentials) |
| `createdAt` | `Date` | No | `Date.now` | Default timestamp | Audit event occurrence timestamp |

#### Security Validator on `metadata`:
Programmatic recursive inspection: Traverses nested objects and arrays at all depths to strictly reject sensitive keys case-insensitively: `password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `jwt`, `secret`, `apiKey`, `authorization`, `credentials`, `privateKey`. Deeply nested credentials cannot bypass validation.

#### Indexes on `activitylogs`:
- `{ createdAt: -1 }` — Powers global chronological administrative audit feeds.
- `{ actor: 1, createdAt: -1 }` — Powers per-user security audit trails.

---

## 3. Database Relationships & Cardinality

```text
User ──────── 1:N ────────> Post
User ──────── 1:N ────────> Comment
User ──────── 1:N ────────> Like
User ──────── 1:N ────────> Notification (as recipient)
User ──────── 1:N ────────> ActivityLog (as actor)

Post ──────── 1:N ────────> Comment
Post ──────── 1:N ────────> Like
```

### Relationship Consistency
- All references store 12-byte binary BSON `ObjectId` values pointing to `_id` in target collections.
- Foreign key references are indexed on child collections (e.g. `Post.author`, `Comment.post`, `Like.post`), guaranteeing query performance when traversing relationships.

---

## 4. Deletion & Referential Cleanup Strategy (Active Implementation — Phases 8, 10, 12, 13)

Referential integrity and cascade deletions are actively enforced across all post, comment, and administrative management workflows:

1. **User Deletion / Account Suspension:**
   - **Status Suspension (Phase 12):** Administrative policy marks `accountStatus: 'suspended'`. Suspended users are immediately rejected by `requireAuth` (HTTP 403) and their `tokenVersion` is incremented to invalidate active sessions instantly.
   - **Feed Filtering (Phase 9 & 12):** Posts from suspended accounts or deleted authors are automatically omitted from `/api/feed` and `/api/explore` queries.
   - **Admin Self-Protection (Phase 12):** Administrators are strictly prohibited from suspending their own accounts (HTTP 400).

2. **Post Deletion (Author & Admin Moderation — Phase 8 & 12):**
   - When a `Post` document is deleted via author `DELETE /api/posts/:postId` or administrator `DELETE /api/admin/posts/:postId`:
     - Cascaded cleanup removes all associated `Comment` records matching `{ post: postId }`.
     - Cascaded cleanup removes all associated `Like` records matching `{ post: postId }`.
     - Cascaded cleanup removes all associated `Notification` records matching `{ resourceType: 'Post', resourceId: postId }`.
     - Recorded in `ActivityLog` with action `post_deletion` or `admin_action`.

3. **Comment Moderation & Like Removal (Phase 10 & 12):**
   - When a comment is deleted by author or administrator: the comment is removed and the post's dynamic comment count updates cleanly.
   - When a like is toggled off: the like record is removed and the post's dynamic like count updates cleanly.
   - Post likes enforce uniqueness via compound index `{ post: 1, user: 1 }` preventing duplicate likes at the database engine layer.

---

## 5. MongoDB Atlas Setup Guide

To connect Looply to a managed MongoDB Atlas cloud cluster:

### Step 1: Create a Free Atlas Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create an organization and project named `Looply`.
3. Deploy a free **M0 Sandbox** cluster in your preferred region.

### Step 2: Configure Database Access (User)
1. Navigate to **Security** &rarr; **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password Authentication**:
   - Username: `looply_admin`
   - Password: `<secure-password>`
4. Grant the user **Read and Write to Any Database** (or specify `looply`).

### Step 3: Configure Network Access (IP Whitelist)
1. Navigate to **Security** &rarr; **Network Access**.
2. Click **Add IP Address**.
3. For local development, add your current IP address (or `0.0.0.0/0` with caution for staging environments).

### Step 4: Obtain Connection String
1. In the **Database Deployments** view, click **Connect**.
2. Choose **Drivers** &rarr; **Node.js** (version 5.5 or later).
3. Copy the SRV connection URI:
   ```text
   mongodb+srv://looply_admin:<password>@cluster0.abcde.mongodb.net/looply?retryWrites=true&w=majority
   ```

### Step 5: Configure Server Environment
Create or edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
MONGODB_URI=mongodb+srv://looply_admin:YOUR_ACTUAL_PASSWORD@cluster0.abcde.mongodb.net/looply?retryWrites=true&w=majority
```
> [!IMPORTANT]
> Never commit `server/.env` to source control. The `.env` file is excluded in `.gitignore`.

---

## 6. Live MongoDB Atlas Connection Verification

The backend has been verified against the live MongoDB Atlas cluster:

| Verification Check | Target / Configuration | Verified Status |
| :--- | :--- | :---: |
| **Cluster Endpoint** | `cluster0.vtydaeh.mongodb.net` | **CONNECTED** |
| **Database Name** | `looply` | **ACTIVE** |
| **Database User** | `ravikishan76768_db_user` | **AUTHENTICATED** |
| **Admin Ping Command** | `db.admin().ping()` | **`{ ok: 1 }`** |
| **Connection Timing** | Live handshake & SRV resolution | **3.1s** |
| **URI Credential Masking** | `sanitizeMongoUri()` | **VERIFIED (`***`)** |
| **Process Liveness Probe** | `GET /api/health` | **HTTP 200 OK** |
| **Database Readiness Probe** | `GET /api/health/ready` | **HTTP 200 OK** |
| **Disconnected Fallback Probe** | `GET /api/health/ready` (disconnected) | **HTTP 503 Service Unavailable** |

### Verified Collections & Synchronized Atlas Indexes

All six collections and their production indexes have been synchronized and confirmed active in the Atlas database:

1. **`users` Collection:**
   - `{ _id: 1 }` (MongoDB default)
   - `{ email: 1 }` (`unique: true`) — Exactly ONE unique index, preventing duplicate registrations.

2. **`posts` Collection:**
   - `{ _id: 1 }` (MongoDB default)
   - `{ createdAt: -1 }` — Powers chronological community feed.
   - `{ author: 1, createdAt: -1 }` — Compound index for author profile timelines.

3. **`comments` Collection:**
   - `{ _id: 1 }` (MongoDB default)
   - `{ post: 1, createdAt: -1 }` — Compound index for post discussion threads.

4. **`likes` Collection:**
   - `{ _id: 1 }` (MongoDB default)
   - `{ post: 1, user: 1 }` (`unique: true`) — Unique compound index preventing duplicate likes.

5. **`notifications` Collection:**
   - `{ _id: 1 }` (MongoDB default)
   - `{ recipient: 1, createdAt: -1 }` — User alert chronological retrieval.
   - `{ recipient: 1, readAt: 1 }` — Unread alert counting and filtering.

6. **`activitylogs` Collection:**
   - `{ _id: 1 }` (MongoDB default)
   - `{ createdAt: -1 }` — Platform audit log stream.
   - `{ actor: 1, createdAt: -1 }` — Per-user security event tracking.



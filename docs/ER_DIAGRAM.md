# Looply Entity-Relationship (ER) Diagram & Model Specifications

> **Project:** Looply ("Connect. Share. Express.")  
> **Database:** MongoDB / Mongoose ODM  
> **Phase Milestone:** Phase 3 — Backend Foundation and Database Design  

---

## 1. Visual Entity-Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ POST : "authors (1:N)"
    USER ||--o{ COMMENT : "writes (1:N)"
    USER ||--o{ LIKE : "creates (1:N)"
    USER ||--o{ NOTIFICATION : "receives (1:N)"
    USER ||--o{ NOTIFICATION : "triggers as actor (0..1:N)"
    USER ||--o{ ACTIVITY_LOG : "initiates as actor (0..1:N)"

    POST ||--o{ COMMENT : "contains (1:N)"
    POST ||--o{ LIKE : "receives (1:N)"

    USER {
        ObjectId _id PK "Unique user identifier"
        string fullName "Public member name (2-70 chars)"
        string email UK "Unique lowercase trimmed contact email"
        string passwordHash "Argon2/bcrypt hash (select: false)"
        string role "Clearance role: 'user' | 'admin'"
        boolean isEmailVerified "Email verification flag (default: false)"
        string profile_bio "Short biographical note (max 250 chars)"
        string profile_avatarUrl "URL of public avatar picture"
        string accountStatus "Operational status: 'active' | 'suspended'"
        date createdAt "Creation timestamp (Mongoose timestamps)"
        date updatedAt "Modification timestamp (Mongoose timestamps)"
    }

    POST {
        ObjectId _id PK "Unique post identifier"
        ObjectId author FK "Reference to User._id (required)"
        string content "Text content (1-1000 chars)"
        date createdAt "Publication timestamp (indexed: -1)"
        date updatedAt "Modification timestamp"
    }

    COMMENT {
        ObjectId _id PK "Unique comment identifier"
        ObjectId post FK "Reference to Post._id (required)"
        ObjectId author FK "Reference to User._id (required)"
        string content "Comment text (1-500 chars)"
        date createdAt "Comment timestamp (Mongoose timestamps)"
        date updatedAt "Modification timestamp"
    }

    LIKE {
        ObjectId _id PK "Unique like record identifier"
        ObjectId post FK "Reference to Post._id (compound unique UK)"
        ObjectId user FK "Reference to User._id (compound unique UK)"
        date createdAt "Interaction timestamp (default: Date.now)"
    }

    NOTIFICATION {
        ObjectId _id PK "Unique notification identifier"
        ObjectId recipient FK "Reference to User._id (required)"
        ObjectId actor FK "Optional reference to User._id (null for system)"
        string type "login_alert | post_like | post_comment | system"
        string message "Descriptive notification text (max 300 chars)"
        string resourceType "Target model: 'Post' | 'Comment' | 'User' | 'System'"
        ObjectId resourceId "Reference identifier of affected entity"
        date readAt "Nullable view timestamp (null = unread)"
        date createdAt "Creation timestamp (default: Date.now)"
    }

    ACTIVITY_LOG {
        ObjectId _id PK "Unique audit event identifier"
        ObjectId actor FK "Optional reference to User._id (null for system)"
        string action "Registration, login, post, comment, like, admin"
        string targetType "Target resource class name"
        ObjectId targetId "Identifier of affected resource"
        mixed metadata "Sanitized context payload (credentials forbidden)"
        date createdAt "Event occurrence timestamp (indexed: -1)"
    }
```

---

## 2. Collection Details & Field Inventories

### 2.1 User Entity (`users`)
- **Primary Key:** `_id` (`ObjectId`)
- **Unique Constraints:** `email` (`{ email: 1 }, { unique: true }`)
- **Security Protections:** `passwordHash` is excluded from default queries via `select: false`.
- **Enumerations:**
  - `role`: `'user'`, `'admin'` (default: `'user'`)
  - `accountStatus`: `'active'`, `'suspended'` (default: `'active'`)

### 2.2 Post Entity (`posts`)
- **Primary Key:** `_id` (`ObjectId`)
- **Foreign Keys:**
  - `author` &rarr; `User._id` (Required)
- **Validation:** `content` is required, trimmed, min 1, max 1000 characters.
- **Indexes:**
  - `{ createdAt: -1 }` (Global chronological feed)
  - `{ author: 1, createdAt: -1 }` (Author timeline)

### 2.3 Comment Entity (`comments`)
- **Primary Key:** `_id` (`ObjectId`)
- **Foreign Keys:**
  - `post` &rarr; `Post._id` (Required)
  - `author` &rarr; `User._id` (Required)
- **Validation:** `content` is required, trimmed, min 1, max 500 characters.
- **Indexes:**
  - `{ post: 1, createdAt: -1 }` (Post reply stream)

### 2.4 Like Entity (`likes`)
- **Primary Key:** `_id` (`ObjectId`)
- **Foreign Keys:**
  - `post` &rarr; `Post._id` (Required)
  - `user` &rarr; `User._id` (Required)
- **Unique Compound Index:**
  - `{ post: 1, user: 1 }` (`unique: true`) — Authoritative guarantee that a user cannot like the same post more than once.

### 2.5 Notification Entity (`notifications`)
- **Primary Key:** `_id` (`ObjectId`)
- **Foreign Keys:**
  - `recipient` &rarr; `User._id` (Required)
  - `actor` &rarr; `User._id` (Optional, nullable for system notices)
- **Enumerations:**
  - `type`: `'login_alert'`, `'post_like'`, `'post_comment'`, `'system'`
  - `resourceType`: `'Post'`, `'Comment'`, `'User'`, `'System'`, `null`
- **Indexes:**
  - `{ recipient: 1, createdAt: -1 }` (User notification inbox)
  - `{ recipient: 1, readAt: 1 }` (Fast unread count and filtering)

### 2.6 Activity Log Entity (`activitylogs`)
- **Primary Key:** `_id` (`ObjectId`)
- **Foreign Keys:**
  - `actor` &rarr; `User._id` (Optional, nullable for unauthenticated or system events)
- **Enumerations:**
  - `action`: `user_registration`, `successful_login`, `post_creation`, `post_update`, `post_deletion`, `comment_creation`, `like_creation`, `admin_action`
- **Security Validation:** `metadata` field validator enforces zero credential leakage (rejects passwords, password hashes, and JWT tokens).
- **Indexes:**
  - `{ createdAt: -1 }` (Platform chronological audit stream)
  - `{ actor: 1, createdAt: -1 }` (Actor audit history)

---

## 3. Database Design Decisions

1. **Why Normalized References over Embedded Subdocuments?**
   Social networks produce unbounded growth in comments and likes on popular posts. Embedding comments or likes inside a `Post` document would risk exceeding the 16MB MongoDB BSON document limit and cause significant document write locking and high memory churn. Normalized child collections scale to millions of interactions cleanly.

2. **Why a Dedicated `Like` Collection?**
   Using a separate collection with a unique compound index `{ post: 1, user: 1 }` prevents race conditions when concurrent like requests occur, guarantees idempotency at the database storage engine layer, and provides simple O(1) existence checks (`Like.exists({ post, user })`).

3. **Why Compound Indexing for Notifications?**
   Querying unread notifications requires filtering by `{ recipient: userId, readAt: null }`. An index on `{ recipient: 1, readAt: 1 }` permits MongoDB index-only scans, avoiding document fetching during badge count operations.

4. **Why Security by Schema Exclusion?**
   Declaring `passwordHash` with `select: false` ensures that even if a developer forgets to specify `.select('-passwordHash')` in a user query or controller, the password hash is never exposed to API consumers or client browsers.


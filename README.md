# Looply

> **Tagline:** Connect. Share. Express.

Looply is a professional, full-stack, AI-powered social media platform built for rich, secure, and meaningful real-time community engagement.

---

## 1. System Overview

Looply is architected as two decoupled applications within a unified workspace:
- **`client/`**: Modern Next.js application leveraging the App Router, JavaScript, and Tailwind CSS.
- **`server/`**: Modular Node.js / Express.js REST API providing authoritative business logic, structured routing, and environment-governed security controls.

Development follows a strict **18-phase implementation lifecycle**. Each phase is verified independently before proceeding to subsequent milestones.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Language:** JavaScript (ES6+, JSX)
- **Styling:** Tailwind CSS (Modern token-driven styling)
- **Font & Assets:** Next.js font optimization, custom SVG vector branding

### Backend
- **Runtime:** Node.js (20.9+)
- **Framework:** Express.js (Modular REST architecture)
- **CORS:** Environment-governed origin restriction (no wildcards)
- **Environment:** `dotenv` configuration management

### Database (Planned - Phase 3)
- MongoDB & Mongoose (Deferred until subsequent phases as per phase boundaries)

---

## 3. Repository Architecture

```text
c:/assestement_project/
├── .gitignore
├── README.md
├── ARCHITECTURE.md
├── ROUTE_MAP.md
├── PROJECT_STATUS.md
├── client/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── next.config.mjs
│   ├── jsconfig.json
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.js
│   │   │   └── page.js
│   │   ├── (auth)/
│   │   │   └── layout.js
│   │   ├── (user)/
│   │   │   └── layout.js
│   │   ├── (admin)/
│   │   │   └── layout.js
│   │   ├── layout.js
│   │   └── globals.css
│   ├── components/
│   │   ├── brand/
│   │   │   └── Logo.js
│   │   ├── layout/
│   │   │   ├── Navbar.js
│   │   │   └── Footer.js
│   │   └── status/
│   │       └── PhaseStatusCard.js
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   │   └── routes.js
│   ├── services/
│   └── public/
│       ├── favicon.svg
│       └── logo.svg
└── server/
    ├── .env.example
    ├── .gitignore
    ├── package.json
    └── src/
        ├── app.js
        ├── server.js
        ├── config/
        │   ├── env.js
        │   └── cors.js
        ├── controllers/
        │   └── health.controller.js
        ├── middleware/
        │   └── error.middleware.js
        ├── models/
        ├── routes/
        │   ├── index.js
        │   └── health.routes.js
        ├── services/
        └── validators/
```

---

## 4. Getting Started

### Prerequisites
- Node.js 20.9+ (tested with v24.16.0)
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

### Test Backend Health Endpoint
```bash
curl http://localhost:5000/api/health
```
Expected output:
```json
{"success":true,"message":"Looply backend is running"}
```

### Test Client Production Build
```bash
cd client
npm run build
```

---

## 6. Phase Roadmap Summary

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 1** | **Project architecture and initial setup.** | **IMPLEMENTATION COMPLETED (Awaiting Review)** |
| Phase 2 | UI foundation, routing and dashboard layouts. | Pending |
| Phase 3 | Backend foundation and database design. | Pending |
| Phase 4 | User registration and login. | Pending |
| Phase 5 | Email verification, forgot password and password reset. | Pending |
| Phase 6 | Authentication security and role-based access control. | Pending |
| Phase 7 | User profile management. | Pending |
| Phase 8 | Post creation, editing and deletion. | Pending |
| Phase 9 | Social media feed and viewing other users' posts. | Pending |
| Phase 10 | Likes and comments. | Pending |
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


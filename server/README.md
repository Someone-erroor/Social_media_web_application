# Looply Server Architecture & Configuration

This directory contains the backend REST API and WebSocket services for Looply ("Connect. Share. Express.").

---

## 1. Environment Configuration

All backend environment settings are declared in `.env` (local-only, never committed) based on `.env.example`:

```bash
# Server Port & Runtime
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/looply
MONGODB_TEST_URI=mongodb://localhost:27017/looply_test

# Authentication & Session Security
JWT_SECRET=<32+ char cryptographically secure hex secret>
JWT_EXPIRES_IN=7d

# SMTP Transactional Email (Phase 5)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Looply <noreply@looply.net>
CLIENT_URL=http://localhost:3000

# Google Gemini AI (Phase 14)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

---

## 2. Google Gemini AI Setup (Phase 14)

Looply uses the official Google Gen AI SDK (`@google/genai`) to power AI post drafting and tone refinement:

1. **Obtaining an API Key:**
   - Sign in to Google AI Studio at: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Click **Create API Key**.
   - Copy your key and add it to `server/.env`:
     ```bash
     GEMINI_API_KEY=your_gemini_api_key_here
     GEMINI_MODEL=gemini-2.5-flash
     ```

2. **Security & Credential Isolation:**
   - The Gemini API key must **strictly reside on the backend** in `server/.env`.
   - Never prefix with `NEXT_PUBLIC_` or expose in client bundles.
   - Never commit `server/.env` to source control.
   - API endpoints (`POST /api/ai/posts/generate` and `POST /api/ai/posts/improve`) proxy all generation requests securely through the Express backend.

3. **Development & Testing Mode:**
   - In automated test suites (`NODE_ENV=test`), tests run using deterministic mock generation and error simulations (`setForceAiMock(true)`).
   - In development or production environments, if `GEMINI_API_KEY` is not configured, endpoints return `HTTP 503 Service Configuration Required` without fabricating mock output.

---

## 3. Verification Commands

Run test suites from the `server` directory:

```bash
# Foundation and models test suite
npm test

# Phase 4 authentication test suite
npm run test:auth

# Batch 2 test suite (Phases 5-9)
npm run test:batch2

# Batch 3 test suite (Phases 10-14: Likes, Comments, Admin, Sockets, AI)
npm run test:batch3

# All automated suites executed sequentially
npm run test:all
```


# CampusBites Click & Collect — Production Deployment Guide

This guide provides operational instructions for deploying and configuring CampusBites in production environments.

---

## 1. System Architecture

- **Frontend**: React 18 Single Page Application (Vite + Tailwind CSS), served via Nginx with HTTP/2 and static asset caching.
- **Backend**: FastAPI (Python 3.12) running under ASGI Uvicorn workers.
- **Database**: PostgreSQL 16 (production) with SQLAlchemy connection pooling, or SQLite (local development).
- **WebSockets**: Native ASGI WebSockets for real-time kitchen dispatch and customer order tracking.
- **Security**: PBKDF2 password hashing, HS256 signed JWT tokens, role-based backend authorization, rate limiting, and HMAC-SHA256 webhook verification.

---

## 2. Environment Variables & Secret Configuration

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Set secure secrets:
   ```env
   ENVIRONMENT=production
   DEBUG=false
   SECRET_KEY=<generate-64-character-hex-random-key>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # Production PostgreSQL
   DATABASE_URL=postgresql://canteen_user:your_secure_password@db:5432/canteen_db
   DB_POOL_SIZE=10
   DB_MAX_OVERFLOW=20

   # CORS Allowed Origins
   FRONTEND_URL=https://canteen.yourcampus.edu,https://app.yourcampus.edu

   # Payment Gateway (Razorpay / UPI)
   PAYMENT_MODE=PRODUCTION
   PAYMENT_WEBHOOK_SECRET=<your-razorpay-webhook-secret>
   RAZORPAY_KEY_ID=<your-razorpay-key-id>
   RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>

   # Rate Limiting
   PICKUP_VERIFICATION_MAX_ATTEMPTS=5
   PICKUP_VERIFICATION_LOCKOUT_MINUTES=15
   ```

---

## 3. Docker Compose Deployment (Recommended)

The entire stack (PostgreSQL, Backend API, and Frontend SPA) can be launched with a single command:

```bash
# Build and run containers in detached mode
docker-compose up -d --build

# View container status and logs
docker-compose ps
docker-compose logs -f backend
```

Services will be accessible at:
- **Frontend Application**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:8000`
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`
- **Database Readiness Check**: `http://localhost:8000/health/ready`

---

## 4. Payment Gateway Webhook Configuration

When configuring webhooks in your Razorpay / Payment Gateway Dashboard:

1. **Webhook URL**: `https://api.yourcampus.edu/api/payments/webhook`
2. **Secret**: Enter the exact secret configured in `PAYMENT_WEBHOOK_SECRET`.
3. **Active Events**:
   - `payment.captured` (marks order `PAYMENT_CONFIRMED` and notifies kitchen)
   - `payment.failed` (marks order `CANCELLED` and restores reserved inventory)
4. **Signature Verification**: Every incoming webhook payload is validated using constant-time HMAC-SHA256 comparison against `X-Razorpay-Signature` or `X-Webhook-Signature`.

---

## 5. Security & Production Checklist

- [x] **No secrets in version control**: `.env` is ignored in `.gitignore`.
- [x] **Strict CORS**: Origins explicitly match `FRONTEND_URL` (no wildcard `*` with credentials).
- [x] **Signed JWT Auth**: Stateless token verification with database-backed role validation.
- [x] **Password Hashing**: PBKDF2-HMAC-SHA256 with random 16-byte salts and 100,000 iterations.
- [x] **Pickup Passcode Protection**: In-memory rate limiting locks out attempts after 5 consecutive failures for 15 minutes (HTTP 429).
- [x] **Automatic Preparation Timers**: Kitchen timers start strictly based on server-side `accepted_at` and `estimated_ready_at`. Orders never auto-mark ready without human counter action.
- [x] **Audit Trail & Financial Ledger**: All transactions, commissions, and admin actions are recorded in immutable ledger tables.

---

## 6. Backup & Recovery

To create a PostgreSQL backup:
```bash
docker exec -t campusbites-db pg_dump -U canteen_user canteen_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

To restore from a backup:
```bash
cat backup.sql | docker exec -i campusbites-db psql -U canteen_user -d canteen_db
```

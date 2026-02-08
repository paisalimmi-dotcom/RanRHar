# Production Deployment Guide

## Prerequisites

### Required Software
- **Node.js**: v18.x or later
- **pnpm**: v8.x or later (`npm install -g pnpm`)
- **PostgreSQL**: v14.x or later
- **Process Manager**: PM2 or systemd (recommended for production)

### Infrastructure Requirements
- **Domain**: Configured with SSL/TLS certificate
- **Server**: Linux server with at least 2GB RAM
- **Database**: PostgreSQL instance (local or managed service)
- **Reverse Proxy**: Nginx or similar (for SSL termination and routing)

---

## Environment Configuration

### Backend API (`apps/api/.env`)

Create `.env` file in `apps/api/` directory:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ranrhar

# Security: JWT Secret (CRITICAL - Generate using command below)
# MUST be at least 32 characters long
JWT_SECRET=<GENERATE_WITH_COMMAND_BELOW>

# CORS Configuration (Update with your production domain)
CORS_ORIGIN=https://yourdomain.com
```

**Generate JWT Secret:**
```bash
openssl rand -base64 32
```

> [!CAUTION]
> **Never commit `.env` files to version control.** The JWT_SECRET must be unique and kept secret. Use the same secret across all API instances for session consistency.

### Frontend Web (`apps/web/.env.local`)

Create `.env.local` file in `apps/web/` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

---

## Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ranrhar;

# Create user (optional, for security)
CREATE USER ranrhar_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ranrhar TO ranrhar_user;

# Exit psql
\q
```

### 2. Initialize Schema

```bash
# Run main schema
psql -U postgres -d ranrhar -f apps/api/src/db/schema.sql
```

### 3. Run Migrations

Execute migrations in order:

```bash
# Migration 001: Add order status tracking
psql -U postgres -d ranrhar -f apps/api/src/db/migration-001-add-order-status.sql

# Migration 002: Add payments table
psql -U postgres -d ranrhar -f apps/api/src/db/migration-002-add-payments.sql

# Migration 003: Add inventory tables
psql -U postgres -d ranrhar -f apps/api/src/db/migration-003-add-inventory.sql

# Migration 004: Add guest user + fix password hashes
psql -U postgres -d ranrhar -f apps/api/src/db/migration-004-add-guest-and-fix-passwords.sql
```

### 4. Verify Database Setup

```bash
psql -U postgres -d ranrhar -c "\dt"
```

Expected tables: `users`, `orders`, `payments`, `inventory_items`, `stock_movements`, `restaurants`, `menu_categories`, `menu_items`.  
Verify: `SELECT * FROM users WHERE email = 'guest@system';` and `SELECT COUNT(*) FROM menu_items;`

---

## Application Deployment

### 1. Install Dependencies

```bash
cd /path/to/RanRHar-1
pnpm install
```

### 2. Build Applications

```bash
# Build all applications
pnpm -r build

# Or build individually
cd apps/api && pnpm build
cd apps/web && pnpm build
```

### 3. Start Backend API

**Option A: Using PM2 (Recommended)**

```bash
# Install PM2 globally
npm install -g pm2

# Start API server
cd apps/api
pm2 start dist/index.js --name ranrhar-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Option B: Using systemd**

Create `/etc/systemd/system/ranrhar-api.service`:

```ini
[Unit]
Description=RanRHar API Server
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/RanRHar-1/apps/api
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ranrhar-api
sudo systemctl start ranrhar-api
```

### 4. Start Frontend Web

**Option A: Using PM2**

```bash
cd apps/web
pm2 start npm --name ranrhar-web -- start
pm2 save
```

**Option B: Using systemd**

Create `/etc/systemd/system/ranrhar-web.service`:

```ini
[Unit]
Description=RanRHar Web Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/RanRHar-1/apps/web
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable ranrhar-web
sudo systemctl start ranrhar-web
```

---

## Security Checklist

### Pre-Deployment

- [ ] **JWT_SECRET**: Generated using `openssl rand -base64 32` (minimum 32 characters)
- [ ] **Environment Variables**: All `.env` files configured with production values
- [ ] **CORS_ORIGIN**: Set to production domain (no wildcards)
- [ ] **Database Credentials**: Strong passwords, limited privileges
- [ ] **NODE_ENV**: Set to `production` in all environments
- [ ] **SSL/TLS**: Valid certificate configured on reverse proxy
- [ ] **Firewall**: Only necessary ports open (80, 443, PostgreSQL port restricted)

### Optional: Error Tracking (Sentry)

Add to `apps/web/.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=ranrhar
```

### Post-Deployment

- [ ] **HTTPS Enforcement**: All traffic redirected to HTTPS
- [ ] **Security Headers**: Helmet middleware active (verify with browser dev tools)
- [ ] **Rate Limiting**: Verify rate limits are working (test with multiple requests)
- [ ] **Error Handling**: Stack traces hidden in production (test error responses)
- [ ] **Database Backups**: Automated backup schedule configured
- [ ] **Monitoring**: Application and database monitoring in place

---

## Nginx Configuration (Reverse Proxy)

Example Nginx configuration for SSL termination and routing:

```nginx
# API Server
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Web Application
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://api.yourdomain.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-07T13:33:14.000Z"}
```

### 2. API Authentication Test

```bash
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"password123"}'
```

Expected: JWT token response

### 3. Web Application Test

- Visit `https://yourdomain.com`
- Navigate to `/menu/A12` (should display menu)
- Test login at `/login`
- Verify protected routes require authentication

### 4. Run Smoke Tests

```bash
# From project root
.\scripts\smoke-test.ps1
```

---

## Monitoring & Logging

### Application Logs

**PM2:**
```bash
pm2 logs ranrhar-api
pm2 logs ranrhar-web
```

**systemd:**
```bash
journalctl -u ranrhar-api -f
journalctl -u ranrhar-web -f
```

### Database Monitoring

```bash
# Check active connections
psql -U postgres -d ranrhar -c "SELECT count(*) FROM pg_stat_activity;"

# Check table sizes
psql -U postgres -d ranrhar -c "\dt+"
```

### Performance Monitoring

Consider setting up:
- **Application Monitoring**: New Relic, Datadog, or similar
- **Database Monitoring**: pgAdmin, pg_stat_statements
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, Rollbar

---

## Rollback Procedures

### Application Rollback

**Using PM2:**
```bash
# Stop current version
pm2 stop ranrhar-api ranrhar-web

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild
pnpm -r build

# Restart
pm2 restart ranrhar-api ranrhar-web
```

### Database Rollback

Each migration file includes rollback instructions in comments. Execute in reverse order:

```bash
# Rollback migration 002
psql -U postgres -d ranrhar -c "DROP TABLE IF EXISTS payments;"

# Rollback migration 001
psql -U postgres -d ranrhar -c "ALTER TABLE orders DROP COLUMN IF EXISTS status;"
```

> [!WARNING]
> **Database rollbacks may result in data loss.** Always backup before rolling back migrations.

---

## Troubleshooting

### API Server Won't Start

1. Check environment variables: `cat apps/api/.env`
2. Verify database connection: `psql -U postgres -d ranrhar -c "SELECT 1;"`
3. Check logs: `pm2 logs ranrhar-api --lines 100`
4. Verify JWT_SECRET length: Must be at least 32 characters

### Database Connection Errors

1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check DATABASE_URL format: `postgresql://user:pass@host:port/dbname`
3. Test connection: `psql -U postgres -d ranrhar`
4. Check firewall rules if using remote database

### CORS Errors

1. Verify CORS_ORIGIN in `apps/api/.env` matches frontend domain
2. Check browser console for specific CORS error
3. Ensure protocol matches (http vs https)
4. Verify Nginx proxy headers are set correctly

### Rate Limiting Issues

- Global limit: 100 requests per minute
- Auth endpoint: 5 requests per 15 minutes
- If legitimate traffic is blocked, adjust limits in `apps/api/src/index.ts`

---

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs for errors
- **Weekly**: Review database performance, check disk space
- **Monthly**: Update dependencies, review security advisories
- **Quarterly**: Rotate JWT secrets (requires user re-login)

### Database Backups

```bash
# Create backup
pg_dump -U postgres ranrhar > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U postgres -d ranrhar < backup_20260207_133314.sql
```

### Updating Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Run new migrations (if any)
# Check apps/api/src/db/ for new migration-*.sql files

# Rebuild applications
pnpm -r build

# Restart services
pm2 restart all
```

---

## Support & Resources

- **Documentation**: `docs/` directory
- **API Reference**: [docs/API.md](./API.md)
- **Routes Reference**: [docs/ROUTES.md](./ROUTES.md)
- **Database Migrations**: [docs/MIGRATIONS.md](./MIGRATIONS.md)

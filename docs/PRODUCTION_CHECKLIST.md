# Production Deployment Checklist

This checklist ensures all critical steps are completed before and after deploying RanRHar to production.

---

## Pre-Deployment Checklist

### Code Quality & Testing

- [ ] **Lint Check**: Run `pnpm -r lint` - all packages pass with no errors
- [ ] **Build Check**: Run `pnpm -r build` - all packages build successfully
- [ ] **Type Check**: TypeScript compilation passes without errors
- [ ] **Code Review**: All changes reviewed and approved
- [ ] **Git Status**: All changes committed, working directory clean
- [ ] **Version Tag**: Create git tag for release (e.g., `v1.0.0`)

### Environment Configuration

- [ ] **JWT Secret**: Generated using `openssl rand -base64 32` (minimum 32 characters)
- [ ] **Database URL**: Production database connection string configured
- [ ] **API URL**: Frontend configured with production API URL
- [ ] **CORS Origin**: Set to production domain (no wildcards)
- [ ] **NODE_ENV**: Set to `production` in all `.env` files
- [ ] **Port Configuration**: Ports configured correctly (API: 3001, Web: 3000)
- [ ] **Environment Files**: All `.env` files created and validated
- [ ] **Secrets Management**: Sensitive values NOT committed to git

### Database Preparation

- [ ] **Database Created**: PostgreSQL database created
- [ ] **User Permissions**: Database user created with appropriate permissions
- [ ] **Schema Initialized**: Main schema.sql executed successfully
- [ ] **Migrations Applied**: All migrations executed in order
- [ ] **Seed Data**: Test accounts created or production accounts configured
- [ ] **Database Backup**: Initial backup created before deployment
- [ ] **Connection Test**: Verify database connection from application server

### Security Verification

- [ ] **SSL Certificate**: Valid SSL/TLS certificate installed
- [ ] **HTTPS Enforcement**: Automatic redirect from HTTP to HTTPS configured
- [ ] **Security Headers**: Helmet middleware enabled and configured
- [ ] **Rate Limiting**: Rate limits configured (100/min global, 5/15min auth)
- [ ] **CORS Whitelist**: Only production domains allowed
- [ ] **Password Hashing**: bcryptjs configured with 10 rounds
- [ ] **JWT Expiration**: Token expiry set to 1 hour
- [ ] **Firewall Rules**: Only necessary ports open (80, 443, SSH)
- [ ] **Database Access**: PostgreSQL port restricted to application server only
- [ ] **Test Accounts**: Production test accounts secured or removed

### Infrastructure Setup

- [ ] **Server Provisioned**: Production server configured and accessible
- [ ] **Domain Configured**: DNS records pointing to server
- [ ] **Reverse Proxy**: Nginx or similar configured for SSL termination
- [ ] **Process Manager**: PM2 or systemd configured for application management
- [ ] **Log Directory**: Log directories created with proper permissions
- [ ] **Disk Space**: Sufficient disk space available (minimum 10GB free)
- [ ] **Memory**: Sufficient RAM available (minimum 2GB)
- [ ] **Backup Strategy**: Automated backup schedule configured

---

## Deployment Execution

### Application Deployment

- [ ] **1. Pull Code**: Clone or pull latest code from git repository
  ```bash
  git clone https://github.com/yourusername/RanRHar.git
  # or
  git pull origin main
  ```

- [ ] **2. Install Dependencies**: Install all npm packages
  ```bash
  cd RanRHar-1
  pnpm install
  ```

- [ ] **3. Configure Environment**: Create and populate all `.env` files
  ```bash
  cp apps/api/.env.example apps/api/.env
  # Edit apps/api/.env with production values
  ```

- [ ] **4. Build Applications**: Build all packages for production
  ```bash
  pnpm -r build
  ```

- [ ] **5. Database Setup**: Initialize database and run migrations
  ```bash
  psql -U postgres -d ranrhar -f apps/api/src/db/schema.sql
  psql -U postgres -d ranrhar -f apps/api/src/db/migration-001-add-order-status.sql
  psql -U postgres -d ranrhar -f apps/api/src/db/migration-002-add-payments.sql
  ```

- [ ] **6. Start Backend API**: Start API server with process manager
  ```bash
  cd apps/api
  pm2 start dist/index.js --name ranrhar-api
  pm2 save
  ```

- [ ] **7. Start Frontend Web**: Start web application with process manager
  ```bash
  cd apps/web
  pm2 start npm --name ranrhar-web -- start
  pm2 save
  ```

- [ ] **8. Configure Autostart**: Setup PM2 to start on system boot
  ```bash
  pm2 startup
  # Follow the command output instructions
  ```

---

## Post-Deployment Verification

### Health Checks

- [ ] **API Health**: `curl https://api.yourdomain.com/health` returns `{"status":"ok"}`
- [ ] **Web Application**: `https://yourdomain.com` loads successfully
- [ ] **SSL Certificate**: Browser shows secure connection (padlock icon)
- [ ] **HTTPS Redirect**: `http://yourdomain.com` redirects to HTTPS

### Functional Testing

- [ ] **Login Flow**: Test login with production credentials
  ```bash
  curl -X POST https://api.yourdomain.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"owner@test.com","password":"password123"}'
  ```

- [ ] **Token Validation**: Test `/me` endpoint with token
  ```bash
  curl https://api.yourdomain.com/me \
    -H "Authorization: Bearer <token>"
  ```

- [ ] **Create Order**: Test order creation (requires authentication)
- [ ] **List Orders**: Test order retrieval (requires authentication)
- [ ] **Update Order Status**: Test status update (owner/staff only)
- [ ] **Record Payment**: Test payment recording
- [ ] **Get Payment**: Test payment retrieval

### UI/UX Testing

- [ ] **Menu Page**: Navigate to `/menu/A12` - menu items display correctly
- [ ] **Cart Functionality**: Add items to cart - cart summary updates
- [ ] **Checkout Flow**: Complete checkout process - order created successfully
- [ ] **Order Success**: Order success page displays correctly
- [ ] **Login Page**: Login form works - redirects after successful login
- [ ] **Orders Page**: Orders list displays - status updates work
- [ ] **Payment Modal**: Payment recording works - status updates correctly
- [ ] **Unauthorized Page**: Unauthorized access shows error page
- [ ] **Logout**: Logout clears session - redirects to login

### Security Testing

- [ ] **Rate Limiting**: Test rate limits
  ```bash
  # Should block after 5 attempts in 15 minutes
  for i in {1..6}; do curl -X POST https://api.yourdomain.com/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test","password":"test"}'; done
  ```

- [ ] **CORS Policy**: Test CORS from unauthorized origin (should fail)
- [ ] **RBAC Enforcement**: Test unauthorized role access (should return 403)
- [ ] **Token Expiration**: Wait 1 hour, test expired token (should return 401)
- [ ] **SQL Injection**: Test with malicious input (should be sanitized)
- [ ] **XSS Protection**: Test with script tags (should be escaped)

### Performance Testing

- [ ] **Response Time**: API endpoints respond within 200ms
- [ ] **Page Load Time**: Web pages load within 2 seconds
- [ ] **Database Queries**: No slow queries (check PostgreSQL logs)
- [ ] **Memory Usage**: Application memory usage stable (check with `pm2 monit`)
- [ ] **CPU Usage**: CPU usage reasonable under normal load

---

## Monitoring Setup

### Application Monitoring

- [ ] **PM2 Monitoring**: `pm2 monit` shows healthy processes
- [ ] **Process Status**: Both API and web processes running
  ```bash
  pm2 status
  ```

- [ ] **Log Monitoring**: Logs accessible and being written
  ```bash
  pm2 logs ranrhar-api --lines 50
  pm2 logs ranrhar-web --lines 50
  ```

- [ ] **Error Tracking**: No critical errors in logs
- [ ] **Restart Policy**: Processes restart automatically on failure

### Database Monitoring

- [ ] **Connection Pool**: Database connections healthy
  ```bash
  psql -U postgres -d ranrhar -c "SELECT count(*) FROM pg_stat_activity;"
  ```

- [ ] **Table Sizes**: Verify table sizes reasonable
  ```bash
  psql -U postgres -d ranrhar -c "\dt+"
  ```

- [ ] **Index Usage**: Verify indexes being used
  ```bash
  psql -U postgres -d ranrhar -c "SELECT * FROM pg_stat_user_indexes;"
  ```

### System Monitoring

- [ ] **Disk Space**: Monitor disk usage
  ```bash
  df -h
  ```

- [ ] **Memory Usage**: Monitor RAM usage
  ```bash
  free -h
  ```

- [ ] **CPU Usage**: Monitor CPU usage
  ```bash
  top
  ```

- [ ] **Network**: Monitor network connectivity
  ```bash
  ping -c 4 8.8.8.8
  ```

---

## Documentation

- [ ] **Deployment Notes**: Document any deployment-specific configurations
- [ ] **Credentials**: Store production credentials securely (password manager)
- [ ] **Runbook**: Create operations runbook for common tasks
- [ ] **Contact Info**: Document on-call contacts and escalation procedures
- [ ] **Backup Schedule**: Document backup frequency and retention policy
- [ ] **Monitoring Alerts**: Configure alerts for critical failures

---

## Post-Deployment Tasks

### Immediate (Within 24 Hours)

- [ ] **Monitor Logs**: Check logs every 2-4 hours for errors
- [ ] **User Feedback**: Collect initial user feedback
- [ ] **Performance**: Monitor response times and load
- [ ] **Error Rate**: Track error rates and investigate anomalies

### Short-Term (Within 1 Week)

- [ ] **Security Audit**: Review security logs for suspicious activity
- [ ] **Performance Tuning**: Optimize slow queries or endpoints
- [ ] **User Training**: Train staff on new features
- [ ] **Documentation Update**: Update docs based on deployment learnings

### Ongoing

- [ ] **Daily Log Review**: Check logs for errors and warnings
- [ ] **Weekly Backups**: Verify backup completion and test restore
- [ ] **Monthly Updates**: Update dependencies and security patches
- [ ] **Quarterly Review**: Review performance metrics and plan improvements

---

## Rollback Plan

If critical issues are discovered post-deployment:

### Application Rollback

1. **Stop Current Version**
   ```bash
   pm2 stop ranrhar-api ranrhar-web
   ```

2. **Checkout Previous Version**
   ```bash
   git checkout <previous-tag>
   ```

3. **Rebuild**
   ```bash
   pnpm -r build
   ```

4. **Restart**
   ```bash
   pm2 restart ranrhar-api ranrhar-web
   ```

### Database Rollback

1. **Stop Application**
   ```bash
   pm2 stop ranrhar-api
   ```

2. **Restore Database Backup**
   ```bash
   psql -U postgres -d ranrhar < backup_pre_deployment.sql
   ```

3. **Restart Application**
   ```bash
   pm2 restart ranrhar-api
   ```

> [!CAUTION]
> **Database rollbacks may result in data loss.** Only rollback database if absolutely necessary. Consider rolling back application code first.

---

## Sign-Off

### Deployment Team

- [ ] **Developer**: Code changes reviewed and approved
- [ ] **DevOps**: Infrastructure configured and verified
- [ ] **QA**: Testing completed and passed
- [ ] **Product Owner**: Feature acceptance confirmed

### Production Readiness

- [ ] **All Pre-Deployment Items**: Completed
- [ ] **All Deployment Steps**: Executed successfully
- [ ] **All Post-Deployment Checks**: Passed
- [ ] **Monitoring**: Configured and active
- [ ] **Documentation**: Updated and accessible

**Deployment Date**: _______________

**Deployed By**: _______________

**Version**: _______________

**Notes**: _______________

---

## Emergency Contacts

- **On-Call Developer**: _______________
- **Database Administrator**: _______________
- **System Administrator**: _______________
- **Product Owner**: _______________

---

## Additional Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./API.md)
- [Routes Documentation](./ROUTES.md)
- [Migration Guide](./MIGRATIONS.md)
- [Project Status](./STATUS.md)

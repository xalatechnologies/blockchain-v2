# NEX Exchange - Production Deployment Checklist

## Pre-Deployment

### 1. Smart Contracts ✅
- [ ] Deploy NEXRouter contract to NorChain
- [ ] Verify contract on block explorer
- [ ] Configure chain routers for all supported chains
- [ ] Add supported tokens
- [ ] Set fee collector address
- [ ] Configure trading fee (default 0.5%)
- [ ] Update `NEXT_PUBLIC_NEX_ROUTER_ADDRESS` in environment

### 2. Database Setup ✅
- [ ] Create production database (PostgreSQL or Supabase)
- [ ] Run schema: `npm run db:setup`
- [ ] Run migrations: `npm run db:migrate`
- [ ] Verify all tables created
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Test database health endpoint: `/api/db/health`

### 3. RPC Configuration ✅
- [ ] Verify NorChain RPC endpoints are accessible
- [ ] Test HTTP RPC: `https://rpc.norchain.org`
- [ ] Test WebSocket RPC: `wss://ws.norchain.org:8546`
- [ ] Verify chain ID: 65001
- [ ] Test connection from production environment

### 4. Cache Setup (Optional) ✅
- [ ] Set up Redis instance (Upstash, AWS ElastiCache, etc.)
- [ ] Configure `REDIS_URL` environment variable
- [ ] Test cache connection
- [ ] Verify cache statistics endpoint: `/api/cache/stats`

### 5. Environment Variables ✅
- [ ] Set all required environment variables
- [ ] Verify `DATABASE_URL` is set
- [ ] Verify `NEXT_PUBLIC_NORCHAIN_RPC` is set
- [ ] Verify `NEXT_PUBLIC_NORCHAIN_WS` is set
- [ ] Verify `NEXT_PUBLIC_NEX_ROUTER_ADDRESS` is set
- [ ] Set `REDIS_URL` (if using Redis)
- [ ] Verify no secrets in code (use environment variables)

### 6. Security ✅
- [ ] Run security audit: `npm run test:security`
- [ ] Verify rate limiting is configured
- [ ] Check input validation on all endpoints
- [ ] Verify SQL injection prevention
- [ ] Check XSS protection
- [ ] Verify CSRF protection
- [ ] Check secure headers are set
- [ ] Review and update dependencies

### 7. Testing ✅
- [ ] Run all unit tests: `npm test`
- [ ] Verify test coverage: `npm run test:coverage`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Run performance tests: `npm run test:performance`
- [ ] Test all API endpoints
- [ ] Test wallet connection
- [ ] Test swap functionality
- [ ] Test limit orders
- [ ] Test stop-loss orders
- [ ] Test DCA schedules

### 8. Build ✅
- [ ] Run production build: `npm run build`
- [ ] Verify build succeeds without errors
- [ ] Check build output size
- [ ] Verify all assets are included
- [ ] Test production build locally: `npm start`

## Deployment

### 9. Deployment Platform ✅

**Vercel**:
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `.next`
- [ ] Configure custom domain (if needed)
- [ ] Enable preview deployments
- [ ] Deploy to production

**Docker**:
- [ ] Build Docker image: `docker build -t nex-exchange .`
- [ ] Test Docker container locally
- [ ] Push to container registry
- [ ] Deploy to hosting platform
- [ ] Configure environment variables
- [ ] Set up health checks

### 10. Post-Deployment ✅
- [ ] Verify application is accessible
- [ ] Test all pages load correctly
- [ ] Test wallet connection
- [ ] Test swap functionality
- [ ] Verify database connection
- [ ] Check cache is working (if enabled)
- [ ] Monitor error logs
- [ ] Set up monitoring and alerts
- [ ] Configure uptime monitoring
- [ ] Set up error tracking (Sentry, etc.)

### 11. Monitoring ✅
- [ ] Set up application monitoring
- [ ] Configure database monitoring
- [ ] Set up RPC endpoint monitoring
- [ ] Configure cache monitoring
- [ ] Set up alerting for errors
- [ ] Monitor performance metrics
- [ ] Track user analytics

### 12. Documentation ✅
- [ ] Update production URLs in documentation
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Document troubleshooting steps
- [ ] Create runbook for operations

## Production Environment Variables

```env
# Required
NEXT_PUBLIC_NORCHAIN_RPC=https://rpc.norchain.org
NEXT_PUBLIC_NORCHAIN_WS=wss://ws.norchain.org:8546
NEXT_PUBLIC_CHAIN_ID=65001
NEXT_PUBLIC_NEX_ROUTER_ADDRESS=0x...
DATABASE_URL=postgresql://...

# Optional
REDIS_URL=redis://...
NEXT_PUBLIC_INFURA_KEY=...
NEXT_PUBLIC_ALCHEMY_KEY=...
```

## Health Check Endpoints

- Database: `GET /api/db/health`
- Cache: `GET /api/cache/stats`
- Application: `GET /` (should return 200)

## Rollback Plan

1. Keep previous deployment version
2. Have database backup ready
3. Document rollback procedure
4. Test rollback in staging first

## Support Contacts

- **Technical Issues**: [Your support email]
- **Database Issues**: [DBA contact]
- **Infrastructure**: [DevOps contact]

---

**Status**: Ready for production deployment after completing checklist items.


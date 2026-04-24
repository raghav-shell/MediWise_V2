# MediWise Deployment Checklist

This checklist ensures your MediWise application is production-ready before deploying to Railway and Vercel.

---

## Backend Pre-Deployment Checklist

### Database Setup

- [ ] Create Supabase account (supabase.com)
- [ ] Create new PostgreSQL project in Supabase
- [ ] Copy DATABASE_URL from Supabase project settings
- [ ] Ensure database is in production region
- [ ] Enable SSL/TLS connections
- [ ] Set up automated backups

### Environment Configuration

- [ ] Copy `.env.example` to `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Set `DATABASE_URL` (from Supabase)
- [ ] Generate strong `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Set `GROQ_API_KEY` (from console.groq.com)
- [ ] Set `FRONTEND_URL` to your Vercel frontend URL
- [ ] Verify all environment variables are set
- [ ] Test `.env` file locally: `npm run dev`

### Code Quality

- [ ] Remove all console.log() debug statements (optional, good practice)
- [ ] Check for any hardcoded values or credentials
- [ ] Verify all imports are correct
- [ ] Run linter (if configured): `npm run lint`
- [ ] Review error handling in critical functions
- [ ] Ensure no .env file is committed to git

### Testing

- [ ] Test `/health` endpoint: `curl http://localhost:3000/health`
- [ ] Test registration endpoint: `POST /api/auth/register`
- [ ] Test login endpoint: `POST /api/auth/login`
- [ ] Test protected endpoints with valid JWT token
- [ ] Test medicine search: `GET /api/medicine/search?q=Amoxicillin`
- [ ] Test cabinet operations (create, read, update, delete)
- [ ] Test interaction checker: `POST /api/interactions`
- [ ] Test prescription scan: `POST /api/scan`
- [ ] Verify CORS is working (test from Vercel URL)
- [ ] Test error handling (send invalid data)

### Database Migration

- [ ] Run schema migration locally: `npm run migrate`
- [ ] Verify all tables were created in Supabase
- [ ] Check table indexes are created
- [ ] Verify foreign key constraints
- [ ] Test database connection with production DATABASE_URL
- [ ] Backup database before first production deployment

### Dependencies

- [ ] Review all dependencies in package.json
- [ ] Remove unused dependencies
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Update critical security patches if needed
- [ ] Lock dependency versions to prevent unexpected updates

### Performance

- [ ] Review database query performance
- [ ] Check for N+1 query problems
- [ ] Verify indexes on frequently queried columns
- [ ] Set up query result caching if needed
- [ ] Test with 1000+ records in database

### Security

- [ ] Verify JWT_SECRET is strong (32+ characters)
- [ ] Check that passwords are hashed (bcrypt)
- [ ] Verify SQL injection protection (parameterized queries)
- [ ] Check CORS configuration
- [ ] Verify rate limiting is considered (TODO for future)
- [ ] Test authentication on protected routes
- [ ] Ensure sensitive data is not logged
- [ ] Review error messages (don't expose internals)

---

## Railway Deployment Steps

### 1. Connect Repository

- [ ] Create Railway account (railway.app)
- [ ] Connect your GitHub repository
- [ ] Select the project repository
- [ ] Select `backend` folder as source

### 2. Add PostgreSQL Plugin

- [ ] In Railway dashboard, go to your project
- [ ] Click "Add Service"
- [ ] Select "PostgreSQL"
- [ ] Wait for database to initialize
- [ ] Copy the `DATABASE_URL` from the plugin

### 3. Configure Environment Variables

- [ ] Go to project settings → Variables
- [ ] Add all environment variables from .env:
  ```
  NODE_ENV=production
  PORT=3000
  DATABASE_URL=<from_postgres_plugin>
  JWT_SECRET=<your_secret>
  GROQ_API_KEY=<your_groq_key>
  FRONTEND_URL=<your_vercel_url>
  LOG_LEVEL=info
  ```
- [ ] Verify all variables are set
- [ ] No values should be empty

### 4. Deploy Backend

- [ ] Railway will auto-detect Node.js
- [ ] Verify build is successful
- [ ] Check deployment logs for errors
- [ ] Copy the deployed URL (e.g., `https://mediwise-backend.railway.app`)

### 5. Run Database Migration

- [ ] Go to Railway project → CLI
- [ ] Run: `npm run migrate`
- [ ] Verify all tables were created
- [ ] Check Supabase UI to confirm tables

### 6. Test Deployed API

- [ ] Test `/health` endpoint
- [ ] Test authentication flow
- [ ] Test cabinet operations
- [ ] Test medicine search
- [ ] Check response times
- [ ] Verify error handling

---

## Frontend Pre-Deployment Checklist

### Environment Configuration

- [ ] Update `.env.production` with backend API URL
- [ ] Set `REACT_APP_API_URL=<railway_backend_url>`
- [ ] Remove all Firebase Firestore references for data
- [ ] Keep Firebase Auth if using (optional)
- [ ] Verify API URLs are correct

### Code Updates

- [ ] Update all API endpoints to use new backend URLs
- [ ] Replace Firebase data operations with API calls
- [ ] Update authentication to use backend JWT (or Firebase Auth)
- [ ] Remove Firestore collection references
- [ ] Test all pages locally
- [ ] Verify all API calls work with backend

### Testing

- [ ] Test login/registration flow
- [ ] Test medicine search
- [ ] Test cabinet CRUD operations
- [ ] Test drug interaction checker
- [ ] Test prescription scanning
- [ ] Test on mobile devices
- [ ] Test with different network speeds (throttle in DevTools)
- [ ] Check console for errors
- [ ] Verify no sensitive data in local storage

### Build & Performance

- [ ] Build frontend: `npm run build`
- [ ] Check build size (should be <500KB gzipped)
- [ ] Verify no build errors
- [ ] Run Lighthouse audit
- [ ] Check for unused imports
- [ ] Optimize images
- [ ] Enable production mode in React

### Security

- [ ] Remove all debug console.log() statements
- [ ] Verify API URLs don't expose sensitive info
- [ ] Check that tokens are stored securely
- [ ] Verify HTTPS is enabled
- [ ] Check Content Security Policy headers
- [ ] Verify no hardcoded secrets in code

---

## Vercel Deployment

### 1. Connect Frontend

- [ ] Go to vercel.com
- [ ] Import project from GitHub
- [ ] Select `frontend` folder
- [ ] Framework preset should be "Other"

### 2. Configure Build Settings

- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`

### 3. Set Environment Variables

- [ ] Add to Vercel environment:
  ```
  REACT_APP_API_URL=<your_railway_backend_url>
  ```

### 4. Deploy

- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] Copy the Vercel URL (e.g., `https://mediwise.vercel.app`)

### 5. Test Production

- [ ] Visit Vercel URL
- [ ] Test all major features
- [ ] Check Network tab for API calls
- [ ] Verify backend URL is correct in API calls

---

## Post-Deployment Validation

### API Connectivity

- [ ] Test API from production frontend
- [ ] Verify CORS headers are correct
- [ ] Check for mixed content warnings (HTTP vs HTTPS)
- [ ] Monitor API response times
- [ ] Check error logging

### Database Health

- [ ] Monitor database connection count
- [ ] Check for slow queries
- [ ] Verify backups are running
- [ ] Monitor disk space usage

### Security

- [ ] Verify HTTPS is enforced
- [ ] Check security headers
- [ ] Monitor for suspicious activity
- [ ] Review access logs

### User Experience

- [ ] Load application in incognito window
- [ ] Test complete user flow (register → search → cabinet)
- [ ] Test on mobile browsers
- [ ] Check page load times
- [ ] Verify error messages are user-friendly

### Monitoring Setup

- [ ] Set up error tracking (Sentry)
- [ ] Set up logging aggregation
- [ ] Configure alerts for critical errors
- [ ] Set up uptime monitoring
- [ ] Configure database monitoring

---

## Rollback Plan

If deployment fails:

### Backend Rollback (Railway)

1. Go to Railway → Deployments
2. Find the previous successful deployment
3. Click "Redeploy"
4. Wait for deployment to complete

### Frontend Rollback (Vercel)

1. Go to Vercel → Deployments
2. Find the previous successful deployment
3. Click "Promote to Production"
4. Wait for DNS to propagate (usually <1min)

---

## Post-Launch Checklist

### Week 1

- [ ] Monitor error logs daily
- [ ] Check database performance
- [ ] Gather user feedback
- [ ] Fix any reported bugs
- [ ] Monitor API response times

### Month 1

- [ ] Analyze user data and search patterns
- [ ] Optimize frequently accessed medicines in database
- [ ] Review and improve error messages
- [ ] Monitor infrastructure costs
- [ ] Plan improvements based on usage

### Ongoing

- [ ] Keep dependencies updated
- [ ] Monitor security advisories
- [ ] Regular database backups
- [ ] Performance optimization
- [ ] User feedback incorporation

---

## Troubleshooting Common Issues

### "Database connection failed"

- Verify DATABASE_URL is correct
- Check Supabase is accessible
- Verify network allows PostgreSQL (port 5432)
- Check SSL certificate validity

### "CORS error in browser"

- Verify backend has CORS enabled
- Check FRONTEND_URL matches actual frontend URL
- Clear browser cache
- Test with curl to isolate issue

### "401 Unauthorized on protected routes"

- Verify JWT token is being sent
- Check token format (Bearer <token>)
- Verify JWT_SECRET matches between services
- Check token expiration

### "Slow API responses"

- Check database query performance
- Review application logs
- Check Railway CPU/Memory usage
- Consider query optimization or caching

### "502 Bad Gateway"

- Check backend is running: `/health` endpoint
- Review deployment logs
- Check for application crashes
- Verify environment variables are set

---

## Success Criteria

✅ All items checked
✅ No critical errors in logs
✅ API responding in <500ms
✅ All endpoints working
✅ User can complete full app flow
✅ Database persisting data correctly
✅ Authentication working securely
✅ Zero security vulnerabilities detected
✅ Performance acceptable on mobile devices
✅ Team confidence in production readiness

---

**Deployment Checklist v1.0** | April 2026

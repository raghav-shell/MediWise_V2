# MediWise Quick Start Guide

Get the refactored backend running in 5 minutes.

---

## Prerequisites

- Node.js 16+ installed
- PostgreSQL/Supabase account
- Groq API key (free at console.groq.com)
- Git

---

## Local Development (5 minutes)

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mediwise
JWT_SECRET=dev_secret_key_123
GROQ_API_KEY=gsk_xxxxx
```

### 3. Initialize Database

```bash
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

✅ Server running at http://localhost:3000

---

## Testing Endpoints

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com"
  }
}
```

### 3. Login (save token!)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the `token` from response.

### 4. Search Medicine

```bash
curl http://localhost:3000/api/medicine/search?q=Amoxicillin
```

### 5. Add to Cabinet (protected)

```bash
curl -X POST http://localhost:3000/api/cabinet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "medicine_name": "Amoxicillin",
    "dosage": "500mg",
    "notes": "Take 3x daily"
  }'
```

### 6. Get Cabinet (protected)

```bash
curl http://localhost:3000/api/cabinet \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Check Interactions

```bash
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "medicines": ["Amoxicillin", "Ibuprofen"]
  }'
```

---

## Important Commands

```bash
# Development with auto-reload
npm run dev

# Production start
npm start

# Initialize database schema
npm run migrate

# Check dependencies
npm list

# Update dependencies
npm update
```

---

## Common Issues

### "Database connection refused"

```bash
# Check PostgreSQL is running
# Update DATABASE_URL in .env
npm run migrate
```

### "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Port 3000 already in use"

```bash
# Kill the process
lsof -i :3000
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### "GROQ API Error"

```bash
# Verify API key
echo $GROQ_API_KEY

# Check key in .env
# Get new key: https://console.groq.com/keys
```

---

## Project Structure Quick Reference

```
backend/
├── config/db.pg.js          ← Database connection
├── middleware/              ← Auth & error handling
├── routes/                  ← API endpoints
├── controllers/             ← Request handlers
├── services/                ← Business logic
├── server-new.js            ← Main server file
├── package.json             ← Dependencies
├── .env                     ← Environment variables (local)
└── .env.example             ← Template (commit to git)
```

---

## Key Services Explained

### AuthService

Handles user registration, login, JWT token generation

```javascript
import authService from "./services/authService.js";
const user = await authService.loginUser(email, password);
```

### MedicineService

Searches database first, falls back to Groq AI

```javascript
const medicine = await medicineService.searchMedicine("Amoxicillin", userId);
```

### CabinetService

CRUD operations for user's medicine list

```javascript
await cabinetService.addMedicineToCabinet(userId, name, dosage);
```

### ScanService

OCR + AI prescription parsing

```javascript
const medicines = await scanService.scanPrescription(base64Image);
```

### InteractionService

Check drug interactions via Groq AI

```javascript
const result = await interactionService.checkInteractions(["Med1", "Med2"]);
```

---

## Deployment in 3 Steps

### 1. Prepare

```bash
# Update .env.example
# Commit changes to git
git add .
git commit -m "Production-ready refactored backend"
git push
```

### 2. Deploy to Railway

```bash
# Visit railway.app
# Connect GitHub repo
# Select backend folder
# Add PostgreSQL plugin
# Set environment variables (copy from .env but use production values)
```

### 3. Verify

```bash
# Test deployed API
curl https://your-railway-app.railway.app/health

# Run migrations on production
# npm run migrate (via Railway terminal)
```

---

## Next Steps

1. ✅ Run locally: `npm run dev`
2. ✅ Test endpoints with curl commands above
3. ✅ Update frontend to use new API
4. ✅ Deploy to Railway
5. ✅ Deploy frontend to Vercel
6. ✅ Test production environment

---

## Documentation Files

- **ARCHITECTURE.md** - Complete system design
- **FRONTEND_MIGRATION.md** - How to update frontend
- **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist

---

## Getting Help

### Check Logs

```bash
npm run dev  # See server logs
```

### View Database

```bash
# Using psql
psql $DATABASE_URL
\dt              # List tables
SELECT * FROM users;  # Query
```

### Test API Quickly

```bash
# Use Postman or VS Code REST Client
# .http files for quick testing
```

---

## Production Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Database migrated: `npm run migrate`
- [ ] Tested locally: `npm run dev`
- [ ] Security variables are strong
- [ ] No console.log debug statements
- [ ] Error handling tested
- [ ] Performance acceptable (<500ms responses)

---

**Quick Start v1.0** | April 2026

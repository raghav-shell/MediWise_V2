# MediWise Backend - Production-Ready Architecture

## Overview

MediWise Backend has been refactored from a monolithic structure to a **clean, modular, production-ready architecture** using:

- **Framework**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase recommended)
- **AI**: Groq API (LLaMA models)
- **OCR**: Tesseract.js
- **Authentication**: JWT-based
- **Architecture**: MVC (Models → Controllers → Services) with middleware

---

## Directory Structure

```
backend/
├── config/
│   ├── db.pg.js              # PostgreSQL connection pool
│   └── schema.js             # Database schema migration
│
├── middleware/
│   ├── authMiddleware.js      # JWT token verification
│   └── errorHandler.js        # Global error handling
│
├── routes/
│   ├── auth.js               # Authentication endpoints
│   ├── cabinet.js            # Medicine cabinet endpoints
│   ├── medicine.js           # Medicine search endpoints
│   ├── interaction.js        # Drug interaction endpoints
│   └── scan.js               # Prescription scanning endpoints
│
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── cabinetController.js  # Cabinet operations
│   ├── medicineController.js # Medicine search
│   ├── interactionController.js # Interaction checking
│   └── scanController.js     # OCR scanning
│
├── services/
│   ├── authService.js        # User authentication
│   ├── cabinetService.js     # Cabinet database operations
│   ├── medicineService.js    # Medicine search logic + DB fallback
│   ├── interactionService.js # Interaction checking
│   └── scanService.js        # OCR + Groq parsing
│
├── server-new.js             # Main application file
├── package.json
├── .env.example              # Environment variables template
└── README.md
```

---

## Key Architectural Changes

### 1. **Removed SQLite → PostgreSQL**

- ❌ Removed: `better-sqlite3`
- ✅ Added: `pg` (PostgreSQL driver)
- All database queries now use parameterized statements for security
- Connection pooling for better performance

### 2. **Removed Firebase → Backend-Only**

- ❌ Removed: Firebase/Firestore dependency from backend
- ✅ All user data stored in PostgreSQL
- Frontend will use backend API instead of Firebase
- Cabinet data unified in one place (PostgreSQL)

### 3. **Modular Architecture**

- **Services Layer**: Pure business logic, database agnostic
- **Controllers Layer**: HTTP request handling, input validation
- **Middleware Layer**: Authentication, error handling, logging
- **Routes Layer**: Clean API endpoint definitions

### 4. **Database-First Approach**

- **Medicine Search**: Database lookup first, Groq AI only as fallback
- **Search History**: Tracks what medicines are found vs. queried
- **Proper Indexing**: Ensures fast searches even with large datasets

### 5. **Better Error Handling**

- Centralized error handler middleware
- Specific error messages for different scenarios
- Proper HTTP status codes

---

## API Endpoints

### Authentication

```
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # Login user
GET    /api/auth/me                # Get current user (protected)
```

### Medicine Cabinet

```
GET    /api/cabinet                # Get user's cabinet (protected)
POST   /api/cabinet                # Add medicine (protected)
PATCH  /api/cabinet/:id            # Update medicine (protected)
DELETE /api/cabinet/:id            # Remove medicine (protected)
```

### Medicine Search

```
GET    /api/medicine/search?q=name # Search for medicine
GET    /api/medicine/suggestions   # Get autocomplete suggestions
```

### Drug Interactions

```
POST   /api/interactions           # Check interactions between medicines
```

### Prescription Scanning

```
POST   /api/scan                   # Upload & scan prescription image
```

---

## Database Schema

### Users Table

```sql
users:
  - id (SERIAL PRIMARY KEY)
  - email (VARCHAR UNIQUE)
  - password_hash (VARCHAR)
  - name (VARCHAR)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

### Medicines Table

```sql
medicines:
  - id (SERIAL PRIMARY KEY)
  - name (VARCHAR UNIQUE)
  - generic_name (VARCHAR)
  - type (VARCHAR)
  - uses (TEXT)
  - side_effects (TEXT[])
  - warnings (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

### Cabinet Table

```sql
cabinet:
  - id (SERIAL PRIMARY KEY)
  - user_id (INTEGER FK)
  - medicine_name (VARCHAR)
  - dosage (VARCHAR)
  - notes (TEXT)
  - added_at (TIMESTAMP)
```

### Search History Table

```sql
search_history:
  - id (SERIAL PRIMARY KEY)
  - user_id (INTEGER FK, nullable)
  - query (VARCHAR)
  - found_in_db (BOOLEAN)
  - created_at (TIMESTAMP)
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
JWT_SECRET=your_strong_secret_key_here
GROQ_API_KEY=your_groq_key_here
FRONTEND_URL=https://mediwise-frontend.vercel.app
```

### 3. Initialize Database Schema

```bash
npm run migrate
```

This will create all required tables in PostgreSQL.

### 4. Start Server

```bash
# Development with hot reload
npm run dev

# Production
npm start
```

---

## Deployment on Railway

### 1. Create Railway Project

- Connect your GitHub repository
- Select the backend folder

### 2. Add PostgreSQL Plugin

- In Railway dashboard → Add Service → PostgreSQL
- Copy the DATABASE_URL

### 3. Set Environment Variables

In Railway dashboard, add:

```
NODE_ENV=production
DATABASE_URL=<from_railway_postgres>
JWT_SECRET=<generate_strong_key>
GROQ_API_KEY=<your_groq_key>
FRONTEND_URL=<your_vercel_frontend_url>
PORT=3000
```

### 4. Run Database Migration

Once deployed, run migrations through Railway terminal:

```bash
npm run migrate
```

---

## Medicine Search Logic

### Flow Diagram

```
User searches "Amoxicillin"
    ↓
[1] Check PostgreSQL (exact match)
    ├─ Found? → Return data ✅
    └─ Not found? ↓
[2] Check PostgreSQL (partial match)
    ├─ Found? → Return list or data ✅
    └─ Not found? ↓
[3] Query Groq AI
    ├─ Get structured data from LLaMA
    └─ Save to DB for future searches ✅
```

### Benefits

- ✅ Fast lookups for common medicines
- ✅ Consistent data for verified medicines
- ✅ Groq AI acts as enrichment layer
- ✅ Automatically builds medicine database over time
- ✅ Analytics via search_history table

---

## Frontend Integration

### API Response Format

#### Medicine Search

```json
{
  "success": true,
  "id": 1,
  "name": "Amoxicillin 500mg",
  "generic_name": "Amoxicillin",
  "type": "Capsule",
  "uses": "Antibiotic for bacterial infections",
  "sideEffects": ["Nausea", "Diarrhea", "Allergic reactions"],
  "warnings": "Do not use if allergic to penicillin",
  "source": "database"
}
```

#### Cabinet Operations

```json
{
  "success": true,
  "medicines": [
    {
      "id": 1,
      "medicine_name": "Amoxicillin",
      "dosage": "500mg",
      "notes": "Take 1 tablet 3x daily",
      "added_at": "2026-04-24T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### Drug Interactions

```json
{
  "success": true,
  "riskLevel": "SAFE",
  "interactions": [
    {
      "meds": ["Amoxicillin", "Ibuprofen"],
      "severity": "Safe",
      "description": "Generally safe to use together"
    }
  ]
}
```

---

## Updating Frontend

### Changes Required in Frontend

1. **Remove Firebase from cabinet operations**

   ```javascript
   // OLD (Firebase)
   const meds = await getDocs(collection(db, `medicines/${user.id}/items`));

   // NEW (Backend API)
   const response = await fetch("/api/cabinet", {
     headers: { Authorization: `Bearer ${token}` },
   });
   const { medicines } = await response.json();
   ```

2. **Update API endpoints**

   ```javascript
   // OLD
   const response = await fetch(
     "https://mediwise-backend-production.up.railway.app/api/search?q=...",
   );

   // NEW (same URL, but backend now checks DB first)
   const response = await fetch(
     "https://mediwise-backend-production.up.railway.app/api/medicine/search?q=...",
   );
   ```

3. **Store JWT token from login**
   ```javascript
   const { token, user } = await loginResponse.json();
   localStorage.setItem("token", token);
   localStorage.setItem("user", JSON.stringify(user));
   ```

---

## Security Best Practices

✅ **Implemented:**

- JWT-based authentication
- Parameterized queries (prevent SQL injection)
- Password hashing with bcrypt
- CORS configured
- Environment variables for secrets

✅ **To Implement:**

- Rate limiting (use `express-rate-limit`)
- Request validation (use `joi` or `zod`)
- HTTPS in production (Railway handles this)
- Input sanitization

---

## Monitoring & Logging

### Current Logging

- Server startup information
- Request method and path
- Database query slowness detection (>1s)
- Error stack traces

### Future Enhancements

- Structured logging with Winston
- Error tracking with Sentry
- Performance monitoring
- Analytics dashboard

---

## Development Tips

### Adding a New Feature

1. **Create Service** (business logic)

   ```javascript
   // services/newFeatureService.js
   export async function doSomething(data) {
     // Logic here
   }
   ```

2. **Create Controller** (HTTP handler)

   ```javascript
   // controllers/newFeatureController.js
   export async function handleRequest(req, res) {
     const result = await newFeatureService.doSomething(req.body);
     res.json({ success: true, data: result });
   }
   ```

3. **Create Routes** (endpoints)

   ```javascript
   // routes/newFeature.js
   import newFeatureController from "../controllers/newFeatureController.js";
   router.post("/", newFeatureController.handleRequest);
   ```

4. **Register Routes** (in server-new.js)
   ```javascript
   import newFeatureRoutes from "./routes/newFeature.js";
   app.use("/api/newfeature", newFeatureRoutes);
   ```

---

## Troubleshooting

### Database Connection Error

```
Error: getaddrinfo ENOTFOUND db.xxxxx.supabase.co
```

**Solution**: Check DATABASE_URL in .env file

### JWT Authentication Fails

```
Error: Invalid token
```

**Solution**: Ensure JWT_SECRET is set and matches between frontend/backend

### Groq API Error

```
Error: GROQ_API_KEY is MISSING
```

**Solution**: Set GROQ_API_KEY in .env file

### Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution**: Change PORT in .env or kill process: `lsof -i :3000`

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ⏳ Update frontend to use new backend API
3. ⏳ Remove Firebase from frontend (keep for auth if needed)
4. ⏳ Test all endpoints
5. ⏳ Set up monitoring and logging
6. ⏳ Create admin dashboard for medicine database management

---

## Support & Questions

For issues or questions:

1. Check this README
2. Review error logs: `npm run dev` in development
3. Check Railway dashboard for production logs

---

**Version**: 2.0.0 (PostgreSQL Architecture)  
**Last Updated**: April 2026

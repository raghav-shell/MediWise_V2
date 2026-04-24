# MediWise Project Structure Reference

## Complete Directory Tree (Post-Refactoring)

```
MediWise_V2/
│
├── backend/                          ← NEW: Production-ready modular backend
│   ├── config/
│   │   ├── db.pg.js                 ← PostgreSQL connection pool & utilities
│   │   └── schema.js                ← Database schema initialization/migrations
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js        ← JWT token verification
│   │   └── errorHandler.js          ← Global error handling & 404 responses
│   │
│   ├── routes/
│   │   ├── auth.js                  ← POST /api/auth/register, /login, GET /me
│   │   ├── cabinet.js               ← GET/POST/PATCH/DELETE /api/cabinet/*
│   │   ├── medicine.js              ← GET /api/medicine/search, /suggestions
│   │   ├── interaction.js           ← POST /api/interactions
│   │   └── scan.js                  ← POST /api/scan
│   │
│   ├── controllers/
│   │   ├── authController.js        ← register(), login(), getCurrentUser()
│   │   ├── cabinetController.js     ← CRUD operations for cabinet
│   │   ├── medicineController.js    ← searchMedicine(), getMedicineSuggestions()
│   │   ├── interactionController.js ← checkInteractions()
│   │   └── scanController.js        ← scanPrescription()
│   │
│   ├── services/
│   │   ├── authService.js           ← User registration/login/token logic
│   │   ├── cabinetService.js        ← Cabinet CRUD logic
│   │   ├── medicineService.js       ← Search logic (DB first → AI fallback)
│   │   ├── interactionService.js    ← Interaction checking logic
│   │   └── scanService.js           ← OCR + Groq parsing logic
│   │
│   ├── server-new.js                ← Main Express app (replaces old server.js)
│   ├── package.json                 ← Dependencies (pg instead of better-sqlite3)
│   ├── .env                         ← Local environment variables (git ignored)
│   ├── .env.example                 ← Environment template (commit to git)
│   ├── .gitignore                   ← Git ignore rules
│   │
│   ├── ARCHITECTURE.md              ← Complete system design documentation
│   ├── README.md                    ← Original project README
│   │
│   ├── node_modules/                ← Installed dependencies
│   ├── package-lock.json            ← Locked dependency versions
│   │
│   └── [DEPRECATED - Keep for reference]
│       ├── server.js                ← OLD: Monolithic server (replaced by server-new.js)
│       ├── db.js                    ← OLD: SQLite connection (replaced by config/db.pg.js)
│       ├── medivora.db              ← OLD: SQLite database file (delete after migration)
│       ├── capture-logo.js          ← Unused utility
│       ├── screenshot.js            ← Unused utility
│       ├── take-real-screenshots.js ← Unused utility
│       └── eng.traineddata          ← Tesseract data file (can be removed)
│
├── frontend/                         ← React + Vite frontend (minimal changes needed)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── firebase.js              ← UPDATE: Remove Firestore for data
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── README.md
│
├── Documentation Files (Root)
│   ├── QUICK_START.md               ← NEW: 5-minute quick start guide
│   ├── FRONTEND_MIGRATION.md        ← NEW: Guide to update frontend code
│   ├── DEPLOYMENT_CHECKLIST.md      ← NEW: Pre-deployment checklist
│   ├── REFACTORING_SUMMARY.md       ← NEW: Complete refactoring summary
│   └── PROJECT_STRUCTURE.md         ← THIS FILE
│
├── .git/                            ← Git repository
├── .gitignore                       ← Git ignore rules
└── README.md                        ← Project root README

```

---

## File Relationships & Data Flow

### Authentication Flow

```
routes/auth.js
    ↓
controllers/authController.js
    ↓
services/authService.js
    ↓
config/db.pg.js (PostgreSQL)
```

### Medicine Search Flow

```
routes/medicine.js
    ↓
controllers/medicineController.js
    ↓
services/medicineService.js
    ├─→ Database lookup (config/db.pg.js)
    └─→ Groq AI (if not found)
```

### Cabinet Operations Flow

```
middleware/authMiddleware.js (verify JWT)
    ↓
routes/cabinet.js
    ↓
controllers/cabinetController.js
    ↓
services/cabinetService.js
    ↓
config/db.pg.js (PostgreSQL)
```

### Prescription Scanning Flow

```
routes/scan.js
    ↓
controllers/scanController.js
    ↓
services/scanService.js
    ├─→ Tesseract.js (OCR)
    └─→ Groq AI (parse)
```

### Error Handling

```
ALL requests → middleware/errorHandler.js (if error)
                    ↓
              Formatted error response
```

---

## Database Tables

### users

```sql
id          INTEGER PRIMARY KEY AUTO
email       VARCHAR UNIQUE NOT NULL
password_hash VARCHAR NOT NULL
name        VARCHAR NOT NULL
created_at  TIMESTAMP DEFAULT NOW
updated_at  TIMESTAMP DEFAULT NOW
```

### medicines

```sql
id          INTEGER PRIMARY KEY AUTO
name        VARCHAR UNIQUE NOT NULL
generic_name VARCHAR
type        VARCHAR
uses        TEXT
side_effects TEXT[] ARRAY
warnings    TEXT
created_at  TIMESTAMP DEFAULT NOW
updated_at  TIMESTAMP DEFAULT NOW
```

### cabinet

```sql
id          INTEGER PRIMARY KEY AUTO
user_id     INTEGER FK → users.id
medicine_name VARCHAR NOT NULL
dosage      VARCHAR
notes       TEXT
added_at    TIMESTAMP DEFAULT NOW
CONSTRAINT  UNIQUE(user_id, LOWER(medicine_name))
```

### search_history

```sql
id          INTEGER PRIMARY KEY AUTO
user_id     INTEGER FK → users.id (nullable)
query       VARCHAR NOT NULL
found_in_db BOOLEAN DEFAULT FALSE
created_at  TIMESTAMP DEFAULT NOW
```

---

## API Endpoint Summary

```
Authentication (Public)
  POST   /api/auth/register               Register new user
  POST   /api/auth/login                  Login existing user
  GET    /api/auth/me                     Get current user (Protected)

Cabinet (Protected)
  GET    /api/cabinet                     List user's medicines
  POST   /api/cabinet                     Add medicine
  PATCH  /api/cabinet/:id                 Update medicine
  DELETE /api/cabinet/:id                 Remove medicine

Medicine Search (Public)
  GET    /api/medicine/search?q=name      Search medicine
  GET    /api/medicine/suggestions?q=q    Get suggestions

Interactions (Public)
  POST   /api/interactions                Check drug interactions

Prescription Scan (Public)
  POST   /api/scan                        Upload & scan prescription

Health Check (Public)
  GET    /health                          Server health status
```

---

## Environment Variables Reference

```
// Server
NODE_ENV=production
PORT=3000

// Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

// Authentication
JWT_SECRET=your_secret_key_here

// AI Services
GROQ_API_KEY=gsk_xxxxx

// CORS
FRONTEND_URL=https://mediwise.vercel.app

// Logging
LOG_LEVEL=info
```

---

## Key Files to Understand First

1. **server-new.js** - Entry point, middleware setup
2. **config/db.pg.js** - Database connection logic
3. **middleware/authMiddleware.js** - How auth works
4. **services/medicineService.js** - Search with DB fallback
5. **services/authService.js** - User management
6. **routes/\*.js** - API endpoint definitions

---

## Dependencies

**Core:**

- `express` ^5.2.1 - Web framework
- `cors` ^2.8.6 - Cross-origin requests
- `dotenv` ^17.4.2 - Environment variables
- `pg` ^8.11.3 - PostgreSQL driver

**Authentication:**

- `bcrypt` ^6.0.0 - Password hashing
- `jsonwebtoken` ^9.0.3 - JWT tokens

**AI & OCR:**

- `groq-sdk` ^1.1.2 - Groq LLaMA API
- `tesseract.js` ^7.0.0 - OCR engine

**Development:**

- `nodemon` ^3.1.14 - Auto-reload on file changes

---

## Common Tasks

### Add New Endpoint

1. Create service method in `services/`
2. Create controller method in `controllers/`
3. Add route in `routes/`
4. Register route in `server-new.js`

Example:

```javascript
// 1. Service
export async function getStats() { ... }

// 2. Controller
export async function handleGetStats(req, res) {
  const stats = await statsService.getStats();
  res.json(stats);
}

// 3. Route
router.get('/stats', handleGetStats);

// 4. Register
app.use('/api/stats', statsRoutes);
```

### Add New Database Table

1. Edit `config/schema.js`
2. Add CREATE TABLE statement
3. Run `npm run migrate`

### Add Validation

Use middleware or validate in controller:

```javascript
const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json({ error });
```

### Add Logging

Already set up:

```javascript
console.log(`[${timestamp}] ${level}: ${message}`);
```

---

## Deployment Path

```
Local (npm run dev)
    ↓ (test all endpoints)
    ↓
Commit to GitHub
    ↓
Railway (auto-deploy on push)
    ↓ (run npm run migrate)
    ↓
Production API ✅
    ↓
Frontend uses production API
    ↓
Complete! ✅
```

---

## Migration from Old Structure

### Old Files (Keep for Reference)

- `server.js` (400+ lines)
- `db.js` (SQLite)

### New Files (Use These)

- `server-new.js` (clean, 60 lines)
- `config/db.pg.js` (PostgreSQL)
- All service/controller/middleware files

### How to Switch

```bash
# Update package.json
npm start # runs server-new.js

# Database
npm run migrate # sets up PostgreSQL
```

---

## Quick Navigation

| **Want to...**    | **Go to file**                      |
| ----------------- | ----------------------------------- |
| Understand system | ARCHITECTURE.md                     |
| Get running fast  | QUICK_START.md                      |
| Deploy it         | DEPLOYMENT_CHECKLIST.md             |
| Update frontend   | FRONTEND_MIGRATION.md               |
| Fix auth issue    | middleware/authMiddleware.js        |
| Fix search issue  | services/medicineService.js         |
| Add new endpoint  | routes/ + controllers/ + services/  |
| Check database    | config/db.pg.js                     |
| See API endpoints | server-new.js (routes registration) |

---

## Notes

- ✅ Old files (server.js, db.js) can be deleted after migration
- ✅ Database file (medivora.db) is no longer used
- ✅ All data now in PostgreSQL (Supabase)
- ✅ New structure is production-ready
- ✅ Easy to extend and test
- ✅ Proper separation of concerns

---

**Project Structure Reference v1.0** | April 2026

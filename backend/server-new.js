/**
 * MediWise Backend - Production-Ready Architecture
 * 
 * Stack: Node.js + Express + PostgreSQL
 * Database: Supabase (PostgreSQL)
 * AI: Groq (LLaMA models)
 * OCR: Tesseract.js
 * 
 * Architecture:
 * - routes/: API endpoint definitions
 * - controllers/: Request handlers
 * - services/: Business logic
 * - middleware/: Authentication, error handling
 * - config/: Database connections
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authenticateTokenOptional } from './middleware/authMiddleware.js';

// Import routes
import authRoutes from './routes/auth.js';
import cabinetRoutes from './routes/cabinet.js';
import medicineRoutes from './routes/medicine.js';
import interactionRoutes from './routes/interaction.js';
import scanRoutes from './routes/scan.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============== MIDDLEWARE ==============
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large image uploads for OCR
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MediWise Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============== API ROUTES ==============
app.use('/api/auth', authRoutes);
app.use('/api/cabinet', cabinetRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/scan', scanRoutes);

// ============== ERROR HANDLING ==============
app.use(notFoundHandler);
app.use(errorHandler);

// ============== SERVER STARTUP ==============
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     MediWise Backend Server Started        ║
╚════════════════════════════════════════════╝
📍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 URL: http://localhost:${PORT}
🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '⚠️ MISSING'}
🗄️ Database: ${process.env.DATABASE_URL ? '✅ Configured' : '⚠️ MISSING'}
🤖 Groq API: ${process.env.GROQ_API_KEY ? '✅ Configured' : '⚠️ MISSING'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Available endpoints:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

  GET    /api/cabinet
  POST   /api/cabinet
  PATCH  /api/cabinet/:id
  DELETE /api/cabinet/:id

  GET    /api/medicine/search?q=medicine_name
  GET    /api/medicine/suggestions?q=query

  POST   /api/interactions

  POST   /api/scan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

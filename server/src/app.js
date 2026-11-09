import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsOptions } from './config/cors.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable reverse proxy trust for secure cookies & rate limiting behind reverse proxies (Render, Vercel, Nginx)
app.set('trust proxy', 1);

// Security and utility middleware
app.use(helmet({
  contentSecurityPolicy: false, // APIs serving JSON do not require HTML CSP
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Static media uploads serving
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Primary API Router mounted at /api
app.use('/api', apiRoutes);

// Catch 404 routes
app.use(notFoundHandler);

// Catch-all global error handler
app.use(errorHandler);

export default app;

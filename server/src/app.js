import mongoose from 'mongoose';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/who-am-i', (req, res) => {
  res.json({
    db: mongoose.connection.name,
    pid: process.pid,
    title: 'CUSTOM_IDENTIFIER_12345'
  });
});

// Primary API Router mounted at /api
app.use('/api', apiRoutes);

// Catch 404 routes
app.use(notFoundHandler);

// Catch-all global error handler
app.use(errorHandler);

export default app;

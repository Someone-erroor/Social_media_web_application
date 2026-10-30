import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`[Looply Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`[Looply Server] Health check available at http://localhost:${env.PORT}/api/health`);
  console.log(`[Looply Server] Configured frontend origin: ${env.CLIENT_ORIGIN}`);
});

// Handle graceful termination
const handleShutdown = (signal) => {
  console.log(`\n[Looply Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Looply Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

let server;

/**
 * Initializes database connection and starts HTTP listener.
 * Prevents accepting requests until database connection succeeds.
 */
const startServer = async () => {
  try {
    // Establish database connection before accepting HTTP requests
    await connectDatabase();

    server = app.listen(env.PORT, () => {
      console.log(`[Looply Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`[Looply Server] Liveness probe: http://localhost:${env.PORT}/api/health`);
      console.log(`[Looply Server] Readiness probe: http://localhost:${env.PORT}/api/health/ready`);
      console.log(`[Looply Server] Configured frontend origin: ${env.CLIENT_ORIGIN}`);
    });
  } catch (error) {
    console.error(`[Looply Server] Startup halted due to database connection failure: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Handles graceful server shutdown on termination signals.
 *
 * @param {string} signal - Received OS signal (SIGINT, SIGTERM)
 */
const handleShutdown = async (signal) => {
  console.log(`\n[Looply Server] Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      console.log('[Looply Server] HTTP server closed.');
      try {
        await disconnectDatabase();
      } catch (err) {
        console.error(`[Looply Server] Error closing database connection: ${err.message}`);
      }
      process.exit(0);
    });
  } else {
    try {
      await disconnectDatabase();
    } catch (err) {
      console.error(`[Looply Server] Error closing database connection: ${err.message}`);
    }
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();

export { app, server };

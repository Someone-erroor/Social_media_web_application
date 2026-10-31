import { isDatabaseConnected } from '../config/database.js';

/**
 * Basic health check controller
 * Confirms that the Looply backend service process is operational.
 * Preserves the exact existing response contract.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Looply backend is running'
  });
};

/**
 * Database readiness check controller
 * Verifies that the backing MongoDB database connection is active and healthy.
 * Never exposes credentials or internal connection parameters.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getHealthReady = (req, res) => {
  const ready = isDatabaseConnected();

  if (ready) {
    return res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected'
    });
  }

  return res.status(503).json({
    success: false,
    status: 'unready',
    database: 'disconnected',
    message: 'Database connection is not ready'
  });
};

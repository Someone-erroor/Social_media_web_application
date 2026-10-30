/**
 * Health check controller
 * Confirms that the Looply backend service is operational.
 */
export const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Looply backend is running'
  });
};

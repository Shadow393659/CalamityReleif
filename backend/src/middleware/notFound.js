/**
 * 404 Route Not Found Middleware
 */
const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: error.message,
    statusCode: 404,
  });
};

module.exports = notFound;

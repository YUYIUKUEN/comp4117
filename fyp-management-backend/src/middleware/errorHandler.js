module.exports = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  console.error(`[${status}] ${code}: ${message}`);

  res.status(status).json({
    error: message,
    code,
    status,
  });
};

export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  const exposeMessage = status < 500 || process.env.NODE_ENV !== 'production';
  if (status >= 500) console.error(error);
  res.status(status).json({
    message: exposeMessage ? (error.message || 'Something went wrong.') : 'Something went wrong.',
    status
  });
}

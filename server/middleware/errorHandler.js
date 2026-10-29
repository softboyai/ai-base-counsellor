export function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.message || err);
  const status = err.status || 500;
  const message = err.message || "An unexpected error occurred.";
  res.status(status).json({ error: message });
}

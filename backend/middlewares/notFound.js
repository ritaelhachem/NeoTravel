function notFound(req, res) {
  res.status(404).json({
    error: `Route introuvable: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = notFound;

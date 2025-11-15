// JWT verification middleware (placeholder)
module.exports = function (req, res, next) {
  // In production verify JWT here
  // If you have a token: req.headers.authorization = "Bearer <token>"
  req.user = { id: 1, role: 'admin' }; // placeholder
  next();
};

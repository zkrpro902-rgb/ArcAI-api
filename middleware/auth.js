function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'Non authentifié. Connecte-toi avec Discord.' });
  }
  next();
}

module.exports = { requireAuth };

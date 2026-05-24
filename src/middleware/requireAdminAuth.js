const { verifyClientToken } = require("../config/auth");

module.exports = function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ error: "Autenticação necessária." });
  }

  try {
    const payload = verifyClientToken(String(token));
    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Acesso restrito a administradores." });
    }
    req.adminAuth = { id: String(payload.sub), payload };
    return next();
  } catch (error) {
    return res.status(401).json({ error: error.message || "Token inválido." });
  }
};

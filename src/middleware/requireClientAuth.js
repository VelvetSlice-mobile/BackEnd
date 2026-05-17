const { verifyClientToken } = require("../config/auth");

module.exports = function requireClientAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const headerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const token = headerToken || req.headers["x-client-token"] || req.headers["x-client-id"];

  if (!token) {
    return res.status(401).json({ error: "Token de autenticação ausente." });
  }

  try {
    const payload = verifyClientToken(String(token));
    req.clientAuth = {
      id: String(payload.sub),
      payload,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ error: error.message || "Token de autenticação inválido." });
  }
};


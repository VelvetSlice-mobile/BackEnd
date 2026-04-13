const crypto = require("crypto");

const TOKEN_SECRET =
  process.env.CLIENT_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  "velvet-slice-dev-client-secret";

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlEncodeRaw(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function signClientToken(payload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(fullPayload);
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");

  return `${data}.${signature}`;
}

function verifyClientToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("Token de autenticação ausente.");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Token de autenticação inválido.");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");

  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new Error("Token de autenticação inválido.");
  }

  const payload = base64UrlDecode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    throw new Error("Token de autenticação expirado.");
  }

  if (!payload.sub) {
    throw new Error("Token de autenticação inválido.");
  }

  return payload;
}

module.exports = {
  signClientToken,
  verifyClientToken,
};


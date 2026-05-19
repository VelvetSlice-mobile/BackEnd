const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const multer = require("multer");

const AVATAR_DIR = path.resolve(__dirname, "../../uploads/avatars");
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function ensureAvatarDirectory() {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
}

function getAvatarExtension(mimetype) {
  switch (mimetype) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureAvatarDirectory();
      cb(null, AVATAR_DIR);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const extension = getAvatarExtension(file.mimetype);
    const uniqueName = `avatar-${Date.now()}-${crypto.randomUUID()}${extension}`;
    cb(null, uniqueName);
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new Error("Formato inválido. Use JPG, PNG ou WEBP.")
      );
    }

    cb(null, true);
  },
});

function handleAvatarUpload(req, res, next) {
  uploadAvatar.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Imagem muito grande. Limite de 3MB." });
    }
    return res.status(400).json({ error: err.message || "Falha no upload da imagem." });
  });
}

module.exports = {
  uploadAvatar,
  handleAvatarUpload,
  AVATAR_DIR,
  MAX_AVATAR_BYTES,
  ALLOWED_MIME_TYPES,
};


const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const multer = require("multer");

const PRODUCT_IMAGE_DIR = path.resolve(__dirname, "../../uploads/products");
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(PRODUCT_IMAGE_DIR, { recursive: true });
    cb(null, PRODUCT_IMAGE_DIR);
  },
  filename: (req, file, cb) => {
    const EXT_MAP = { "image/png": ".png", "image/webp": ".webp" };
    const ext = EXT_MAP[file.mimetype] ?? ".jpg";
    cb(null, `product-${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

const uploadProductImage = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(new Error("Formato inválido. Use JPG, PNG ou WEBP."));
    cb(null, true);
  },
});

module.exports = { uploadProductImage, PRODUCT_IMAGE_DIR };

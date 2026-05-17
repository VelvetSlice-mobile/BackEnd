const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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
    const ext = file.mimetype === "image/png" ? ".png" : file.mimetype === "image/webp" ? ".webp" : ".jpg";
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

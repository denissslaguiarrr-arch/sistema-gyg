const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "public", "uploads");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MIME_A_EXTENSION = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const extension = MIME_A_EXTENSION[file.mimetype] || path.extname(file.originalname) || "";
    const nombre = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
    cb(null, nombre);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!MIME_A_EXTENSION[file.mimetype]) {
      return cb(new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF"));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.post("/", (req, res) => {
  upload.array("imagenes", 8)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || "No se pudo subir la imagen" });
    }
    const urls = (req.files || []).map((archivo) => `/uploads/${archivo.filename}`);
    res.status(201).json({ urls });
  });
});

module.exports = router;

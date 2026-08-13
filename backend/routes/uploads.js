const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");

const UPLOADS_DIR = path.join(__dirname, "..", "..", "public", "uploads");

const MIME_A_EXTENSION = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/x-png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function asegurarCarpetaUploads() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

asegurarCarpetaUploads();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      asegurarCarpetaUploads();
      cb(null, UPLOADS_DIR);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const extension =
      MIME_A_EXTENSION[file.mimetype] || path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const nombre = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`;
    cb(null, nombre);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    const mime = String(file.mimetype || "").toLowerCase();
    const extension = path.extname(file.originalname || "").toLowerCase();
    const extensionOk = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(extension);
    if (!MIME_A_EXTENSION[mime] && !extensionOk) {
      return cb(new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF"));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.post("/", (req, res, next) => {
  try {
    asegurarCarpetaUploads();
  } catch (err) {
    return res.status(500).json({
      error: `No se pudo crear la carpeta de fotos (${UPLOADS_DIR}): ${err.message}`,
    });
  }

  upload.array("imagenes", 8)(req, res, (err) => {
    if (err) {
      const mensaje = err.message || "No se pudo subir la imagen";
      const esLimiteOTipo =
        err.name === "MulterError" || /solo se permiten/i.test(mensaje) || /file too large/i.test(mensaje);
      return res.status(esLimiteOTipo ? 400 : 500).json({
        error: esLimiteOTipo ? mensaje : `No se pudo guardar la foto: ${mensaje}`,
      });
    }

    try {
      const urls = (req.files || []).map((archivo) => `/uploads/${archivo.filename}`);
      if (urls.length === 0) {
        return res.status(400).json({
          error: "No se recibió ninguna imagen. Probá JPG, PNG, WEBP o GIF de hasta 8 MB.",
        });
      }
      res.status(201).json({ urls });
    } catch (err) {
      next(err);
    }
  });
});

module.exports = router;

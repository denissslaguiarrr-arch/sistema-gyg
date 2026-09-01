const express = require("express");
const { db } = require("../db");
const { hashPassword, ROLES } = require("../auth");

const router = express.Router();

function serialize(row) {
  return {
    id: row.id,
    username: row.username,
    rol: row.rol,
    created_at: row.created_at,
  };
}

function contarAdmins() {
  return db.prepare("SELECT COUNT(*) AS total FROM Usuarios WHERE rol = 'admin'").get().total;
}

router.get("/", (_req, res) => {
  const usuarios = db.prepare("SELECT * FROM Usuarios ORDER BY created_at ASC").all();
  res.json(usuarios.map(serialize));
});

router.post("/", (req, res) => {
  const { username, password, rol } = req.body || {};
  const usernameNormalizado = typeof username === "string" ? username.trim() : "";
  const rolFinal = rol || "vendedor";

  if (!usernameNormalizado || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
  if (!ROLES.includes(rolFinal)) {
    return res.status(400).json({ error: `El rol debe ser uno de: ${ROLES.join(", ")}` });
  }

  const existente = db
    .prepare("SELECT id FROM Usuarios WHERE username = ?")
    .get(usernameNormalizado);
  if (existente) {
    return res.status(409).json({ error: "Ya existe un usuario con ese nombre" });
  }

  const result = db
    .prepare("INSERT INTO Usuarios (username, password_hash, rol) VALUES (?, ?, ?)")
    .run(usernameNormalizado, hashPassword(password), rolFinal);

  const creado = db.prepare("SELECT * FROM Usuarios WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(serialize(creado));
});

router.patch("/:id", (req, res) => {
  const usuario = db.prepare("SELECT * FROM Usuarios WHERE id = ?").get(req.params.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

  const { rol, password } = req.body || {};

  if (rol !== undefined) {
    if (!ROLES.includes(rol)) {
      return res.status(400).json({ error: `El rol debe ser uno de: ${ROLES.join(", ")}` });
    }
    if (usuario.rol === "admin" && rol !== "admin" && contarAdmins() <= 1) {
      return res.status(400).json({ error: "Debe existir al menos un administrador" });
    }
    db.prepare("UPDATE Usuarios SET rol = ? WHERE id = ?").run(rol, usuario.id);
  }

  if (password !== undefined) {
    if (String(password).length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }
    db.prepare("UPDATE Usuarios SET password_hash = ? WHERE id = ?").run(
      hashPassword(password),
      usuario.id
    );
  }

  const actualizado = db.prepare("SELECT * FROM Usuarios WHERE id = ?").get(usuario.id);
  res.json(serialize(actualizado));
});

router.delete("/:id", (req, res) => {
  const usuario = db.prepare("SELECT * FROM Usuarios WHERE id = ?").get(req.params.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

  if (req.usuario && Number(req.params.id) === req.usuario.id) {
    return res.status(400).json({ error: "No podés eliminar tu propio usuario" });
  }
  if (usuario.rol === "admin" && contarAdmins() <= 1) {
    return res.status(400).json({ error: "Debe existir al menos un administrador" });
  }

  db.prepare("DELETE FROM Usuarios WHERE id = ?").run(usuario.id);
  res.status(204).send();
});

module.exports = router;

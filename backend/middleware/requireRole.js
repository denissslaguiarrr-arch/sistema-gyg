// Debe usarse después de requireAuth (necesita req.usuario ya cargado).
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "No tenés permisos para realizar esta acción" });
    }
    next();
  };
}

module.exports = requireRole;

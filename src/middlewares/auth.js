const jwt = require('jsonwebtoken');

// Middleware de protección con JWT desde cookies
exports.protect = async (req, res, next) => {
  try {
    // 1. Obtener token desde cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    // 2. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Adjuntar usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Error en middleware protect:", error);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Restringir acceso por roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
};

// Solo para administradores
exports.checkAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso no autorizado' });
  }
  next();
};

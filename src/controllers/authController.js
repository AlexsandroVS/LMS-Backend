// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.UserID,
      role: user.Role,
      name: user.Name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.getByEmail(email);

    console.log("Usuario encontrado:", user);
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    console.log("🔹 Contraseña recibida en login:", password);
    console.log("🔹 Contraseña en la BD:", user.Password);

    const isMatch = await bcrypt.compare(password, user.Password);
    console.log("🔹 Coincidencia de contraseña:", isMatch);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Marcar al usuario como activo
    await User.update(user.UserID, { isActive: true });

    // Generar token
    const token = generateToken(user);
    const avatarUrl = user.Avatar; // Se asume que ya viene formateado
    res.json({
      token,
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.Role,
        avatar: avatarUrl,
        lastLogin: user.isActive ? "Activo" : user.LastLogin, // Se mostrará "Activo"
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    if (!req.body.password) {
      return res.status(400).json({ error: "La contraseña es obligatoria" });
    }

    console.log("🔹 Contraseña recibida en register:", req.body.password);
    let hashedPassword = req.body.password;
    if (!hashedPassword.startsWith("$2b$10$")) {
      hashedPassword = await User.hashPassword(req.body.password);
    }
    console.log("🔹 Hash generado en register:", hashedPassword);

    const userData = {
      ...req.body,
      password: hashedPassword,
    };

    const userId = await User.create(userData);
    const user = await User.getById(userId);

    console.log("✅ Usuario registrado correctamente en la BD:", user);
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.Role,
        avatar: user.Avatar,
      },
    });
  } catch (error) {
    console.error("❌ Error en register:", error);
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    // Si el usuario está activo, mostrar "Activo", de lo contrario, formatear LastLogin
    const lastLoginDisplay = user.isActive ? "Activo" : user.LastLogin ? new Date(user.LastLogin).toLocaleString() : "-";
    res.json({
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.Role,
        avatar: user.Avatar,
        lastLogin: lastLoginDisplay,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Implementación del logout en authController
exports.logout = async (req, res, next) => {
  try {
    // Se asume que el middleware protect ya ha colocado el token decodificado en req.user
    const userId = req.user.id;
    // Actualizar LastLogin a la fecha y hora actuales, y marcar al usuario como inactivo
    await User.update(userId, { LastLogin: new Date(), isActive: false });
    // Opcional: Puedes invalidar el token en el lado del cliente (por ejemplo, eliminándolo del localStorage)
    res.json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("❌ Error en logout:", error);
    next(error);
  }
};

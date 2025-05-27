// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require('bcrypt');

// Función para generar el token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.UserID,
      email: user.Email,
      role: user.Role,
      name: user.Name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.getByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Actualizamos login
    const now = new Date();
    await User.update(user.UserID, {
      LastLogin: now,
      isActive: true
    });

    const token = generateToken(user);

    // Setear cookie segura
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 día
    });

    res.json({
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.Role,
        avatar: user.Avatar,
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    next(error);
  }
};

// Registro
exports.register = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;

    if (!password) {
      return res.status(400).json({ error: "La contraseña es obligatoria" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      ...rest,
      password: hashedPassword,
    };

    const userId = await User.create(userData);
    const user = await User.getById(userId);
    const token = generateToken(user);

    // Setear cookie segura
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
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

// Obtener usuario actual
exports.getMe = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.getByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      user: {
        id: user.UserID,
        name: user.Name,
        email: user.Email,
        role: user.Role,
        avatar: user.Avatar,
        biografia: user.Biografia || "",
      },
    });
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({ error: "Error al verificar autenticación" });
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await User.update(userId, {
        LastLogin: new Date(),
        isActive: false
      });
    }

    res.clearCookie("token");
    res.json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("❌ Error en logout:", error);
    next(error);
  }
};

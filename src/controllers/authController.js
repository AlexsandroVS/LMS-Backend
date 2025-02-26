// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require('bcrypt'); // Asegúrate de importar bcrypt


const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.UserID,
      email: user.Email,  // Incluir el email en el payload
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
    const user = await User.getByEmail(email);  // Usar getByEmail

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Actualizamos el estado a "active" y el campo LastLogin con la fecha y hora actuales
    const now = new Date();
    await User.update(user.UserID, { 
      LastLogin: now, 
      isActive: true 
    });

    const token = generateToken(user); // Generar el token

    res.json({
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
    const token = req.headers.authorization?.split(" ")[1]; // Obtener el token del header
    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decodificar el token

    // Verificar que el correo esté presente en el token
    const emailFromToken = decoded.email;
    // Usar el email del token para obtener el usuario
    const user = await User.getByEmail(emailFromToken); // Buscar por email en lugar de name

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
      },
    });
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({ error: "Error al verificar autenticación" });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Actualizamos el estado a "inactive" y el campo LastLogin con la fecha y hora actuales
    await User.update(userId, { 
      LastLogin: new Date(), 
      isActive: false 
    });

    res.json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("❌ Error en logout:", error);
    next(error);
  }
};

const User = require('../models/User');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    next(error);
  }
 
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.getById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    // Verificar si el password está presente
    if (!userData.password) {
      return res.status(400).json({ error: "La contraseña es obligatoria" });
    }

    // Si se sube un avatar, guardamos la ruta
    if (req.file) {
      userData.avatar = `/uploads/${req.file.filename}`;
    } else {
      userData.avatar = null;
    }

    const userId = await User.create(userData);

    res.status(201).json({ id: Number(userId), message: "Usuario creado exitosamente" });
  } catch (error) {
    next(error);
  }
};



exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    let updatedFields = req.body;

    if (req.file) {
      updatedFields.avatar = `/uploads/${req.file.filename}`;
    }

    await User.update(userId, updatedFields);
    const updatedUser = await User.getById(userId);

    // Mapear el objeto para tener las claves que espera el front-end
    const mappedUser = {
      id: updatedUser.UserID,
      name: updatedUser.Name,
      email: updatedUser.Email,
      role: updatedUser.Role,
      avatar: updatedUser.Avatar, 
      lastLogin: updatedUser.LastLogin,
    };

    res.json({ message: "Perfil actualizado", user: mappedUser });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.delete(req.params.id);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};
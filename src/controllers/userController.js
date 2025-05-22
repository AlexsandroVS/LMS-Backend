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
    
    if (!userData.password) {
      return res.status(400).json({ error: "La contraseña es obligatoria" });
    }

    if (req.file) {
      userData.avatar = `/uploads/${req.file.filename}`;
    } else {
      userData.avatar = null;
    }

    const userId = await User.create(userData);
    res.status(201).json({ 
      id: Number(userId), 
      message: "Usuario creado exitosamente" 
    });
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

    if (updatedFields.bio !== undefined) {
      updatedFields.biografia = updatedFields.bio;
    }
    

    await User.update(userId, updatedFields);
    const updatedUser = await User.getById(userId);

    res.json({ 
      message: "Perfil actualizado", 
      user: {
        id: updatedUser.UserID,
        name: updatedUser.Name,
        email: updatedUser.Email,
        role: updatedUser.Role,
        avatar: updatedUser.Avatar,
        bio: updatedUser.Biografia, 
        lastLogin: updatedUser.LastLogin,
      }
    });
  } catch (error) {
    next(error);
  }
};  

exports.deleteUser = async (req, res, next) => {
  try {
    // Verificar si el usuario existe primero
    const user = await User.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Eliminación directa
    await User.delete(req.params.id);
    
    res.json({ 
      message: 'Usuario eliminado permanentemente',
      action: 'deleted'
    });
  } catch (error) {
    next(error);
  }
};
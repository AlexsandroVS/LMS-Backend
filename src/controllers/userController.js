const User = require('../models/User');
const multer = require('multer');
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const path = require("path");
const fs = require("fs");

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
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const userId = req.params.id;
    let updatedFields = req.body;

    // 1. Obtener usuario actual
    const [currentUser] = await conn.query(
      "SELECT UserID, Avatar, Name, Email, Role, Biografia, LastLogin FROM Users WHERE UserID = ?",
      [userId]
    );

    if (!currentUser || currentUser.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const oldUser = currentUser[0]; // Para comparar el email anterior

    // 2. Procesar nuevo avatar
    if (req.file) {
      const newFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
      const newAvatarPath = `/uploads/${newFilename}`;
      const tempPath = req.file.path;
      const targetPath = path.join(__dirname, '..', '..', 'uploads', newFilename);
      fs.renameSync(tempPath, targetPath);

      if (oldUser.Avatar && !oldUser.Avatar.startsWith('http')) {
        const oldFilename = path.basename(oldUser.Avatar);
        const oldPath = path.join(__dirname, '..', '..', 'uploads', oldFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      updatedFields.avatar = newAvatarPath;
    }

    // 3. Mapear biografía
    if (updatedFields.bio !== undefined) {
      updatedFields.biografia = updatedFields.bio;
    }

    // 4. Actualizar en la base de datos
    await User.update(userId, updatedFields);

    // 5. Obtener datos actualizados
    const [updatedUserResult] = await conn.query(
      "SELECT UserID, Name, Email, Role, Avatar, Biografia, LastLogin FROM Users WHERE UserID = ?",
      [userId]
    );

    const updatedUser = updatedUserResult[0];
    const userResponse = {
      id: updatedUser.UserID,
      name: updatedUser.Name,
      email: updatedUser.Email,
      role: updatedUser.Role,
      avatar: updatedUser.Avatar.startsWith('http')
        ? updatedUser.Avatar
        : `http://localhost:5000${updatedUser.Avatar}`,
      bio: updatedUser.Biografia,
      lastLogin: updatedUser.LastLogin
    };

    // 6. Verificar si cambió el email → generar nuevo token
    let token = null;
    if (updatedFields.email && updatedFields.email !== oldUser.Email) {
      token = jwt.sign(
        {
          id: updatedUser.UserID,
          email: updatedUser.Email,
          role: updatedUser.Role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
    }

    await conn.commit();
    res.json({
      message: "Perfil actualizado",
      user: userResponse,
      ...(token && { token }) // Solo enviar token si se generó
    });

  } catch (error) {
    await conn.rollback();
    console.error('Error en updateUser:', error);
    next(error);
  } finally {
    conn.release();
  }
};


exports.deleteUser = async (req, res, next) => {
  const conn = await pool.getConnection();
  
  try {
    await conn.beginTransaction();
    const userId = req.params.id;
    
    // 1. Obtener el avatar del usuario
    const [user] = await conn.query(
      "SELECT UserID, Avatar FROM Users WHERE UserID = ?", 
      [userId]
    );
    
    if (!user || user.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // 2. Eliminar el usuario
    await conn.query("DELETE FROM Users WHERE UserID = ?", [userId]);
    
    // 3. Eliminar el avatar si existe
    if (user[0].Avatar) {
      try {
        // Verificar si es una ruta local (no empieza con http)
        if (!user[0].Avatar.startsWith('http')) {
          // Extraer solo el nombre del archivo
          const filename = path.basename(user[0].Avatar);
          // Ruta CORRECTA: subir un nivel desde src y luego a uploads
          const avatarPath = path.join(__dirname, '..', '..', 'uploads', filename);
          
          console.log(`Ruta de eliminación: ${avatarPath}`); // Para depuración
          
          if (fs.existsSync(avatarPath)) {
            fs.unlinkSync(avatarPath);
            console.log(`Archivo eliminado: ${filename}`);
          } else {
            console.log(`El archivo no existe en: ${avatarPath}`);
          }
        }
      } catch (fileError) {
        console.error('Error al eliminar el archivo:', fileError);
      }
    }
    
    await conn.commit();
    res.json({ 
      message: 'Usuario eliminado permanentemente',
      action: 'deleted',
      deletedAvatar: !!user[0].Avatar
    });
  } catch (error) {
    await conn.rollback();
    console.error('Error en deleteUser:', error);
    next(error);
  } finally {
    conn.release();
  }
};
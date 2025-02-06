const pool = require("../config/db");
const bcrypt = require("bcrypt");

const User = {
  async getAll() {
    const conn = await pool.getConnection();
    try {
      const users = await conn.query(
        "SELECT UserID, Name, Email, Avatar, Role, RegistrationDate, LastLogin, isActive FROM Users"
      );
      return users.map((user) => ({
        ...user,
        Avatar: user.Avatar || null, // Asegurar que no haya datos corruptos
      }));
    } finally {
      conn.release();
    }
  },
  

  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const rows = await conn.query(
        "SELECT UserID, Name, Email, Avatar, Role, LastLogin, isActive FROM Users WHERE UserID = ?",
        [id]
      );
      const user = rows[0];
  
      // Si no hay avatar, asignar null
      if (user && !user.Avatar) {
        user.Avatar = null;
      }
  
      return user;
    } finally {
      conn.release();
    }
  },
  

  async getByEmail(email) {
    const conn = await pool.getConnection();
    try {
      const rows = await conn.query(
        "SELECT UserID, Name, Email, Avatar, Role, Password FROM Users WHERE Email = ?",
        [email]
      );
      const user = rows[0];
  
      console.log("Usuario en getByEmail:", user); // 📌 Verifica si la contraseña está en los datos devueltos
  
      if (user && user.Avatar?.startsWith("/uploads/")) {
        user.Avatar = `http://localhost:5000${user.Avatar}`;
      }
      
  
      return user;
    } finally {
      conn.release();
    }
  },
  
  async comparePassword(candidatePassword, hash) {
    return bcrypt.compare(candidatePassword, hash);
  },

  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  },
  async create(userData) {
    const conn = await pool.getConnection();
    try {
      console.log("🔹 Contraseña recibida antes de procesar:", userData.password);
  
      // Solo aplicar hash si la contraseña no está ya en formato bcrypt
      if (userData.password && !userData.password.startsWith("$2b$10$")) {
        userData.password = await this.hashPassword(userData.password);
      }
  
      console.log("🔹 Hash final para la BD:", userData.password);
  
      const result = await conn.query(
        `INSERT INTO Users (Name, Email, Password, Avatar, Role) VALUES (?, ?, ?, ?, ?)`,
        [
          userData.name,
          userData.email,
          userData.password,
          userData.avatar ? userData.avatar : null,
          userData.role || "student",
        ]
      );
  
      console.log("✅ Usuario creado correctamente en la BD");
  
      return result.insertId;
    } finally {
      conn.release();
    }
  },
  
  async update(id, userData) {
    const conn = await pool.getConnection();
    try {
      const updates = [];
      const params = [];
  
      // Extendemos el fieldMap para incluir isActive y LastLogin
      const fieldMap = {
        name: "Name",
        email: "Email",
        avatar: "Avatar",
        role: "Role",
        isActive: "isActive",    // Asegúrate de que el nombre de la columna en la BD sea correcto
        LastLogin: "LastLogin",  // O si prefieres, usa 'lastLogin' y mapea al nombre correcto en la BD
      };
  
      Object.entries(fieldMap).forEach(([key, dbField]) => {
        if (userData[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          params.push(userData[key]);
        }
      });
  
      if (updates.length === 0) {
        throw new Error("No se proporcionaron campos para actualizar");
      }
  
      const query = `UPDATE Users SET ${updates.join(", ")} WHERE UserID = ?`;
      await conn.query(query, [...params, id]);
      return true;
    } finally {
      conn.release();
    }
  }
  
  
};

module.exports = User;

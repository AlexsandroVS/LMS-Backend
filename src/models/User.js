const pool = require("../config/db");
const bcrypt = require("bcrypt");

const User = {
  async getAll() {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM Users");
      return rows;
    } finally {
      conn.release();
    }
  },

  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        "SELECT UserID, Name, Email, Avatar, Role, LastLogin, isActive FROM Users WHERE UserID = ?",
        [id]
      );
      return rows[0];
    } finally {
      conn.release();
    }
  },

  async getByEmail(email) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        "SELECT UserID, Name, Email, Avatar, Role, Password FROM Users WHERE Email = ?",
        [email]
      );
      return rows[0];
    } finally {
      conn.release();
    }
  },

  async comparePassword(candidatePassword, hash) {
    return bcrypt.compare(candidatePassword, hash);
  },

  async create(userData) {
    const conn = await pool.getConnection();
    try {
      // Hashear si la contraseña no está hasheada aún
      if (userData.password && !userData.password.startsWith("$2b$10$")) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      const [result] = await conn.query(
        `INSERT INTO Users (Name, Email, Password, Avatar, Role) VALUES (?, ?, ?, ?, ?)`,
        [
          userData.name,
          userData.email,
          userData.password,
          userData.avatar ? userData.avatar : null,
          userData.role || "student",
        ]
      );

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

      const fieldMap = {
        name: "Name",
        email: "Email",
        avatar: "Avatar",
        role: "Role",
        isActive: "isActive",
        LastLogin: "LastLogin",
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
  },

  async delete(id) {
    const conn = await pool.getConnection();
    try {
      // 1. Anonimizar datos personales
      await conn.query(
        `UPDATE Users 
         SET 
           Name = 'Usuario eliminado',
           Email = CONCAT('deleted_', UserID, '@example.com'),
           Avatar = NULL,
           isActive = 0,
           Password = ''
         WHERE UserID = ?`,
        [id]
      );
      
      // 2. Opcional: Registrar fecha de eliminación
      await conn.query(
        `ALTER TABLE Users ADD COLUMN IF NOT EXISTS DeletedAt DATETIME`
      );
      await conn.query(
        `UPDATE Users SET DeletedAt = NOW() WHERE UserID = ?`,
        [id]
      );
      
      return true;
    } finally {
      conn.release();
    }
  },

  // ✅ Función hashPassword agregada correctamente
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  },
};

module.exports = User;

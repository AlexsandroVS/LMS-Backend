// src/models/User.js
const pool = require("../config/db");
const bcrypt = require('bcrypt'); 
  
const User = {
  async getAll() {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query("SELECT * FROM Users"); // Aquí obtenemos todos los usuarios
      return rows; // Retorna todos los usuarios
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
      return rows[0]; // Asegúrate de que se retorne el primer usuario encontrado
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
      return rows[0]; // Devuelve el primer resultado encontrado
    } finally {
      conn.release(); // Asegúrate de liberar la conexión
    }
  },

  async comparePassword(candidatePassword, hash) {
    return bcrypt.compare(candidatePassword, hash);
  },

  async create(userData) {
    const conn = await pool.getConnection();
    try {
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

      return result.insertId; // Asegúrate de devolver el ID insertado
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
      await conn.query("DELETE FROM Users WHERE UserID = ?", [id]);
      return true;
    } finally {
      conn.release();
    }
  },
};

module.exports = User;

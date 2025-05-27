const pool = require("../config/db");
const bcrypt = require("bcrypt");

const USER_FIELDS = {
  basic:
    "UserID, Name, Email, Avatar, Role, LastLogin, isActive, Biografia, RegistrationDate",
  withPassword:
    "UserID, Name, Email, Avatar, Role, Password, Biografia, RegistrationDate",
};

class User {
  static async executeQuery(query, params = []) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(query, params);
      return rows;
    } finally {
      conn.release();
    }
  }

  static async getAll() {
    return this.executeQuery(`SELECT ${USER_FIELDS.basic} FROM Users`);
  }

  static async getById(id) {
    const rows = await this.executeQuery(
      `SELECT ${USER_FIELDS.basic} FROM Users WHERE UserID = ?`,
      [id]
    );
    return rows[0];
  }

  static async getByEmail(email) {
    const rows = await this.executeQuery(
      `SELECT ${USER_FIELDS.withPassword} FROM Users WHERE Email = ?`,
      [email]
    );
    return rows[0];
  }

  static async comparePassword(candidatePassword, hash) {
    return bcrypt.compare(candidatePassword, hash);
  }

  static async create(userData) {
    // Hashear la contraseña si es necesario
    if (userData.password && !userData.password.startsWith("$2b$10$")) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const result = await this.executeQuery(
      `INSERT INTO Users (Name, Email, Password, Avatar, Role) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userData.name,
        userData.email,
        userData.password,
        userData.avatar || null,
        userData.role || "student",
      ]
    );

    return result.insertId;
  }

  static async update(id, userData) {
    const updates = [];
    const params = [];

    const fieldMap = {
      name: "Name",
      email: "Email",
      avatar: "Avatar",
      role: "Role",
      isActive: "isActive",
      lastLogin: "LastLogin",
      bio: "Biografia", 
      biografia: "Biografia", 
    
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

    await this.executeQuery(
      `UPDATE Users SET ${updates.join(", ")} WHERE UserID = ?`,
      [...params, id]
    );
    return true;
  }
  
  static async delete(id) {
    // Eliminación directa con DELETE ON CASCADE
    await this.executeQuery(`DELETE FROM Users WHERE UserID = ?`, [id]);
    return true;
  }

  static async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }
}

module.exports = User;

// src/models/Activity.js
const pool = require("../config/db"); // Importa el pool con promesas

const Activity = {
  async getAllByModuleId(moduleId) {
    const conn = await pool.getConnection(); // Usar la conexión
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Activities WHERE ModuleID = ? ORDER BY CreatedAt ASC`,
        [moduleId]
      );
      return rows;
    } finally {
      conn.release(); // Liberar la conexión
    }
  },

  async getById(activityId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Activities WHERE ActivityID = ?`,
        [activityId]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  },

  async create(activityData) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        "INSERT INTO Activities (ModuleID, Title, Content, Type, Deadline) VALUES (?, ?, ?, ?, ?)",
        [
          activityData.ModuleID,
          activityData.Title,
          activityData.Content,
          activityData.Type,
          activityData.Deadline,
        ]
      );
      return result.insertId; // Retorna el ID de la actividad creada
    } finally {
      conn.release();
    }
  },

  async update(id, activityData) {
    const conn = await pool.getConnection();
    try {
      const updates = [];
      const params = [];

      const fieldMap = {
        type: "Type",
        title: "Title",
        content: "Content",
        deadline: "Deadline",
      };

      Object.entries(fieldMap).forEach(([key, dbField]) => {
        if (activityData[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          params.push(activityData[key]);
        }
      });

      if (updates.length === 0) return { affectedRows: 0 };

      const sql = `UPDATE Activities SET ${updates.join(
        ", "
      )} WHERE ActivityID = ?`;
      params.push(id);

      const [result] = await conn.query(sql, params);
      return result;
    } finally {
      conn.release();
    }
  },

  // En el modelo Activity.js
  async delete(id) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        // Desestructura el array para obtener el primer elemento
        "DELETE FROM Activities WHERE ActivityID = ?",
        [id]
      );
      console.log(`Eliminación de actividad con ID ${id}:`, result);
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  },
};

module.exports = Activity;

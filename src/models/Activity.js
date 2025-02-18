// src/models/Activity.js
const pool = require('../config/db'); // Importa el pool con promesas

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
      const result = await conn.query(
        `INSERT INTO Activities (ModuleID, Type, Title, Content, Deadline) VALUES (?, ?, ?, ?, ?)`,
        [
          activityData.moduleId,
          activityData.type,
          activityData.title,
          activityData.content,
          activityData.deadline,
        ]
      );
      return result[0].insertId; // Obtener el ID del registro insertado
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
        type: 'Type',
        title: 'Title',
        content: 'Content',
        deadline: 'Deadline',
      };

      Object.entries(fieldMap).forEach(([key, dbField]) => {
        if (activityData[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          params.push(activityData[key]);
        }
      });

      if (updates.length === 0) return { affectedRows: 0 };

      const sql = `UPDATE Activities SET ${updates.join(', ')} WHERE ActivityID = ?`;
      params.push(id);

      const [result] = await conn.query(sql, params);
      return result;
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('DELETE FROM Activities WHERE ActivityID = ?', [id]);
      return result.affectedRows > 0; // Retorna `true` si se eliminó correctamente
    } finally {
      conn.release();
    }
  },
};

module.exports = Activity;

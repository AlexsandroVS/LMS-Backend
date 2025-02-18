// models/Module.js
const pool = require('../config/db');

const Module = {
  async getByCourseId(courseId) {
    const conn = await pool.getConnection();
    try {
      // Aquí hacemos la consulta, obteniendo el array de módulos directamente
      const [rows] = await conn.query(
        `SELECT * FROM Modules WHERE CourseID = ? ORDER BY ModuleOrder ASC`,
        [courseId]
      );
      return rows; // Asegúrate de que solo estás devolviendo los datos de módulos
    } finally {
      conn.release();
    }
  },

  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Modules WHERE ModuleID = ?`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  },

  async create(moduleData) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `INSERT INTO Modules (CourseID, Title, ModuleOrder) 
         VALUES (?, ?, ?)`,
        [
          moduleData.courseId,
          moduleData.title,
          moduleData.moduleOrder || 1
        ]
      );
      return result.insertId;
    } finally {
      conn.release();
    }
  },

  async update(id, moduleData) {
    const conn = await pool.getConnection();
    try {
      const updates = [];
      const params = [];

      const fieldMap = {
        title: 'Title',
        moduleOrder: 'ModuleOrder'
      };

      Object.entries(fieldMap).forEach(([key, dbField]) => {
        if (moduleData[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          params.push(moduleData[key]);
        }
      });

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      await conn.query(
        `UPDATE Modules SET ${updates.join(', ')} WHERE ModuleID = ?`,
        [...params, id]
      );
      return true;
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('DELETE FROM Modules WHERE ModuleID = ?', [id]);
      return true;
    } finally {
      conn.release();
    }
  }
};

module.exports = Module;

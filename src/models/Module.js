// models/Module.js
const pool = require('../config/db');

const Module = {
  async getByCourseId(courseId, includeLocked = false) {
    const conn = await pool.getConnection();
    try {
      let query = `SELECT * FROM Modules WHERE CourseID = ?`;
      const params = [courseId];
      
      if (!includeLocked) {
        query += ` AND IsLocked = 0`;
      }
      
      query += ` ORDER BY ModuleOrder ASC`;
      
      const [rows] = await conn.query(query, params);
      return rows;
    } finally {
      conn.release();
    }
  },

  // controllers/modulesController.js
async getByCourseId(courseId, isAdmin = false) {
  const conn = await pool.getConnection();
  try {
    let query = `SELECT * FROM Modules WHERE CourseID = ?`;
    const params = [courseId];
    
    if (!isAdmin) {
      query += ` AND IsLocked = 0`; // Filtrar los módulos bloqueados si no es admin
    }
    
    query += ` ORDER BY ModuleOrder ASC`;
    
    const [rows] = await conn.query(query, params);
    return rows;
  } finally {
    conn.release();
  }
},


  async create(moduleData) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `INSERT INTO Modules (CourseID, Title, ModuleOrder, IsLocked) 
         VALUES (?, ?, ?, ?)`,
        [
          moduleData.courseId,
          moduleData.title,
          moduleData.moduleOrder || 1,
          moduleData.isLocked || false
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
  },
  async updateLock(moduleId, isLocked) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `UPDATE Modules SET IsLocked = ? WHERE ModuleID = ?`,
        [isLocked, moduleId]
      );
      return result.affectedRows > 0; // Asegurarse de que se haya actualizado correctamente
    } finally {
      conn.release();
    }
  }
};

module.exports = Module;

const pool = require('../config/db');

const Course = {
  async getAll() {
    const conn = await pool.getConnection();
    try {
      return await conn.query(`
        SELECT c.*, u.Name as CreatedByName 
        FROM Courses c
        JOIN Users u ON c.CreatedBy = u.UserID
      `);
    } finally {
      conn.release();
    }
  },

  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const rows = await conn.query(`
        SELECT c.*, u.Name as CreatedByName 
        FROM Courses c
        JOIN Users u ON c.CreatedBy = u.UserID
        WHERE c.CourseID = ?
      `, [id]);
      return rows[0];
    } finally {
      conn.release();
    }
  },

  async create(courseData) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `INSERT INTO Courses 
        (Title, Description, Icon, Status, DurationHours, CreatedBy) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          courseData.title,
          courseData.description,
          courseData.icon || null,
          courseData.status || 'active',
          courseData.durationHours || 0,
          courseData.createdBy
        ]
      );
      return result.insertId;
    } finally {
      conn.release();
    }
  },

  async update(id, courseData) {
    const conn = await pool.getConnection();
    try {
      // 1. Construir actualización dinámica
      const updates = [];
      const params = [];
      
      // Mapeo de campos permitidos
      const fieldMap = {
        title: 'Title',
        description: 'Description',
        icon: 'Icon',
        status: 'Status',
        durationHours: 'DurationHours'
      };
  
      // 2. Recorrer campos proporcionados
      Object.entries(fieldMap).forEach(([key, dbField]) => {
        if (courseData[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          
          // Manejar valor por defecto para icono
          const value = key === 'icon' && courseData[key] === '' ? null : courseData[key];
          params.push(value);
        }
      });
  
      // 3. Validar campos a actualizar
      if (updates.length === 0) {
        throw new Error('No se proporcionaron campos válidos para actualizar');
      }
  
      // 4. Construir y ejecutar consulta
      const query = `
        UPDATE Courses 
        SET ${updates.join(', ')}
        WHERE CourseID = ?
      `;
  
      await conn.query(query, [...params, id]);
      return true;
  
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('DELETE FROM Courses WHERE CourseID = ?', [id]);
      return true;
    } finally {
      conn.release();
    }
  }
};

module.exports = Course;
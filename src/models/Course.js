const pool = require("../config/db");

const Course = {
  // Modelo Course
  async getAll() {
    const conn = await pool.getConnection();
    try {
      return await conn.query(`
      SELECT c.CourseID, c.Title, c.Description, c.Icon, c.Status, c.DurationHours, c.CreatedBy, c.Color, u.Name as CreatedByName
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
      const [rows] = await conn.query(
        `SELECT c.CourseID, c.Title, c.Description, c.Icon, c.Status, c.DurationHours, c.CreatedBy, c.CreatedAt, c.Color, u.Name as CreatedByName
         FROM Courses c
         JOIN Users u ON c.CreatedBy = u.UserID
         WHERE c.CourseID = ?`, [id]
      );
      return rows[0];  // Asegúrate de que esto esté devolviendo el primer (y único) registro
    } finally {
      conn.release();
    }
  },
  

  async create(courseData) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query(
        `INSERT INTO Courses 
          (Title, Description, Icon, Status, DurationHours, CreatedBy, Color) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          courseData.title,
          courseData.description,
          courseData.icon || null,
          courseData.status || "active",
          courseData.durationHours || 0,
          courseData.createdBy,
          courseData.color || null,
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
      const updates = [];
      const params = [];

      const fieldMap = {
        title: "Title",
        description: "Description",
        icon: "Icon",
        status: "Status",
        durationHours: "DurationHours",
        color: "Color",
      };

      Object.entries(fieldMap).forEach(([key, dbField]) => {
        if (courseData[key] !== undefined) {
          updates.push(`${dbField} = ?`);
          const value =
            key === "icon" && courseData[key] === "" ? null : courseData[key];
          params.push(value);
        }
      });

      if (updates.length === 0) {
        throw new Error("No se proporcionaron campos válidos para actualizar");
      }

      const query = `
        UPDATE Courses 
        SET ${updates.join(", ")}
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
      await conn.query("DELETE FROM Courses WHERE CourseID = ?", [id]);
      return true;
    } finally {
      conn.release();
    }
  },
};

module.exports = Course;

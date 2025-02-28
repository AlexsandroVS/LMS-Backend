const pool = require("../config/db");

const ProgressSummary = {
  async update(userId, courseId, moduleId = null) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        'CALL UpdateProgressSummary(?, ?, ?)',
        [userId, courseId, moduleId]
      );
      return true;
    } finally {
      conn.release();
    }
  },

  async getByUserCourse(userId, courseId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT * FROM ProgressSummary
        WHERE UserID = ? AND CourseID = ?
        ORDER BY ModuleID IS NULL DESC, ModuleID
      `, [userId, courseId]);
      return rows;
    } finally {
      conn.release();
    }
  }
};

module.exports = ProgressSummary;
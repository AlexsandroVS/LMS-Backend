const pool = require("../config/db");
const ProgressSummary = require("./ProgressSummary");
const UserProgress = {
  async create(progressData) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `INSERT INTO UserProgress 
        (UserID, CourseID, ModuleID, ActivityID, Status, Score) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          progressData.userId,
          progressData.courseId,
          progressData.moduleId || null,
          progressData.activityId || null,
          progressData.status || 'not-started',
          progressData.score || null
        ]
      );
      await ProgressSummary.update(
        progressData.userId,
        progressData.courseId,
        progressData.moduleId
      );
      return result.insertId;
    } finally {
      conn.release();
    }
  },

  async update(progressId, updateData) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `UPDATE UserProgress SET 
        Status = ?, Score = ?, LastAccessed = NOW(),
        CompletedAt = IF(? = 'completed', NOW(), CompletedAt)
        WHERE ProgressID = ?`,
        [
          updateData.status,
          updateData.score,
          updateData.status,
          progressId
        ]
      );
      await ProgressSummary.update(
        existingProgress.UserID,
        existingProgress.CourseID,
        existingProgress.ModuleID
      );
      return result.affectedRows;
    } finally {
      conn.release();
    }
  },

  async findByUserAndCourse(userId, courseId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM UserProgress 
        WHERE UserID = ? AND CourseID = ?`,
        [userId, courseId]
      );
      return rows;
    } finally {
      conn.release();
    }
  },

  async getEnrollments() {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT DISTINCT UserID, CourseID, Status, LastAccessed 
        FROM UserProgress WHERE ModuleID IS NULL AND ActivityID IS NULL`
      );
      return rows;
    } finally {
      conn.release();
    }
  }
};

module.exports = UserProgress;
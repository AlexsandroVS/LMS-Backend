// models/Assignment.js
const pool = require("../config/db");

const Assignment = {
  async getAll() {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
          SELECT ca.*, c.Title AS CourseTitle, u.Name AS TeacherName
          FROM CourseAssignments ca
          JOIN Courses c ON ca.CourseID = c.CourseID
          JOIN Users u ON ca.TeacherID = u.UserID
        `);
      return rows;
    } finally {
      conn.release();
    }
  },

  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM CourseAssignments WHERE AssignmentID = ?`,
        [id]
      );
      return rows[0];
    } finally {
      conn.release();
    }
  },

  async create(data) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `INSERT INTO CourseAssignments (CourseID, TeacherID) VALUES (?, ?)`,
        [data.courseId, data.teacherId]
      );
      return result.insertId;
    } finally {
      conn.release();
    }
  },

  async update(id, data) {
    const conn = await pool.getConnection();
    try {
      await conn.query(
        `UPDATE CourseAssignments SET CourseID = ?, TeacherID = ? WHERE AssignmentID = ?`,
        [data.courseId, data.teacherId, id]
      );
      return true;
    } finally {
      conn.release();
    }
  },

  async getStudentsByTeacher(teacherId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `
      SELECT
        se.StudentID,
        su.Name AS StudentName,
        su.Email AS StudentEmail,
        su.Avatar AS StudentAvatar,
        su.Role AS StudentRole,
        su.isActive AS StudentActive,
        su.RegistrationDate AS StudentRegistrationDate,
        ca.CourseID,
        c.Title AS CourseTitle
      FROM CourseAssignments ca
      JOIN StudentEnrollments se ON ca.AssignmentID = se.AssignmentID
      JOIN Users su ON se.StudentID = su.UserID
      JOIN Courses c ON ca.CourseID = c.CourseID
      WHERE ca.TeacherID = ?
      ORDER BY se.StudentID
    `,
      [teacherId]
    );
    return rows;
  } finally {
    conn.release();
  }
},

  async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query(`DELETE FROM CourseAssignments WHERE AssignmentID = ?`, [
        id,
      ]);
      return true;
    } finally {
      conn.release();
    }
  },
};

module.exports = Assignment;

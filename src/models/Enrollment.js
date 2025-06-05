// models/Enrollment.js
const pool = require("../config/db");

const Enrollment = {
  async getAll() {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`
        SELECT se.*, u.Name AS StudentName, ca.AssignmentID, c.Title AS CourseTitle
        FROM StudentEnrollments se
        JOIN Users u ON se.StudentID = u.UserID
        JOIN CourseAssignments ca ON se.AssignmentID = ca.AssignmentID
        JOIN Courses c ON ca.CourseID = c.CourseID
      `);
      return rows;
    } finally {
      conn.release();
    }
  },

  async getById(id) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`SELECT * FROM StudentEnrollments WHERE EnrollmentID = ?`, [id]);
      return rows[0];
    } finally {
      conn.release();
    }
  },

  async create(data) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `INSERT INTO StudentEnrollments (AssignmentID, StudentID) VALUES (?, ?)`,
        [data.assignmentId, data.studentId]
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
        `UPDATE StudentEnrollments SET AssignmentID = ?, StudentID = ? WHERE EnrollmentID = ?`,
        [data.assignmentId, data.studentId, id]
      );
      return true;
    } finally {
      conn.release();
    }
  },

  async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query(`DELETE FROM StudentEnrollments WHERE EnrollmentID = ?`, [id]);
      return true;
    } finally {
      conn.release();
    }
  },
  async getUniqueStudentsByTeacher(teacherId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT DISTINCT se.StudentID, u.Name AS StudentName
      FROM CourseAssignments ca
      JOIN StudentEnrollments se ON ca.AssignmentID = se.AssignmentID
      JOIN Users u ON se.StudentID = u.UserID
      WHERE ca.TeacherID = ?
      ORDER BY u.Name
    `, [teacherId]);
    return rows;
  } finally {
    conn.release();
  }
},

async getCoursesByStudent(studentId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT 
        c.CourseID,
        c.Title,
        c.Description,
        c.Icon,
        c.Status,
        c.CreatedBy,
        u.Name AS CreatedByName,
        c.Color,
        c.Image,
        c.Category,
        c.CreatedAt
      FROM StudentEnrollments se
      JOIN CourseAssignments ca ON se.AssignmentID = ca.AssignmentID
      JOIN Courses c ON ca.CourseID = c.CourseID
      JOIN Users u ON c.CreatedBy = u.UserID
      WHERE se.StudentID = ?
    `, [studentId]);
    
    return rows.map(course => ({
      id: course.CourseID,
      title: course.Title,
      description: course.Description,
      icon: course.Icon,
      status: course.Status,
      createdBy: course.CreatedBy,
      createdByName: course.CreatedByName, // Usamos directamente el Name
      color: course.Color || "#48CAE4",
      image: course.Image,
      category: course.Category,
      createdAt: course.CreatedAt || null
    }));
  } finally {
    conn.release();
  }
},
}

module.exports = Enrollment;

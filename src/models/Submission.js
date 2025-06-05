const pool = require("../config/db");

const Submission = {
  // Obtener todas las entregas de un usuario para una actividad
  async getByActivityAndUser(activityId, userId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT s.*, f.FileName, f.Files as FileUrl
        FROM Submissions s
        LEFT JOIN Files f ON s.SubmissionID = f.SubmissionID
        WHERE s.ActivityID = ? AND s.UserID = ?
        ORDER BY s.SubmittedAt DESC`,
        [activityId, userId]
      );
      return rows;
    } finally {
      conn.release();
    }
  },
  async getById(submissionId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT * FROM Submissions WHERE SubmissionID = ?`,
        [submissionId]
      );
      return rows[0] || null;
    } finally {
      conn.release();
    }
  },

  // Obtener entrega final (marcada como válida)
  async getFinalSubmission(activityId, userId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT s.*, f.FileName, f.Files as FileUrl
        FROM Submissions s
        LEFT JOIN Files f ON s.SubmissionID = f.SubmissionID
        WHERE s.ActivityID = ? AND s.UserID = ? AND s.IsFinal = TRUE`,
        [activityId, userId]
      );
      return rows[0] || null;
    } finally {
      conn.release();
    }
  },
  async getOverallAverageByUser(userId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `
        SELECT m.CourseID, AVG(s.Score) AS CourseAverage
        FROM Submissions s
        JOIN Activities a ON s.ActivityID = a.ActivityID
        JOIN Modules m ON a.ModuleID = m.ModuleID
        JOIN StudentEnrollments se ON se.StudentID = s.UserID
        JOIN CourseAssignments ca ON ca.AssignmentID = se.AssignmentID
        WHERE s.UserID = ? 
          AND s.IsFinal = 1 
          AND s.Score IS NOT NULL 
          AND ca.CourseID = m.CourseID
        GROUP BY m.CourseID
      `,
        [userId]
      );

      const validCourses = rows.filter(
        (row) => row.CourseAverage !== null && !isNaN(row.CourseAverage)
      );

      if (validCourses.length === 0) {
        return { courseAverage: 0.0, count: 0 };
      }

      const total = validCourses.reduce(
        (acc, row) => acc + parseFloat(row.CourseAverage),
        0
      );
      const average = parseFloat((total / validCourses.length).toFixed(2));

      return {
        courseAverage: average,
        count: validCourses.length,
      };
    } finally {
      conn.release();
    }
  },

  // Contar intentos realizados por usuario
  async countAttempts(activityId, userId) {
    const conn = await pool.getConnection();
    try {
      const [[result]] = await conn.query(
        `SELECT COUNT(*) AS attempts 
          FROM Submissions 
          WHERE ActivityID = ? AND UserID = ?`,
        [activityId, userId]
      );
      return result.attempts;
    } finally {
      conn.release();
    }
  },
  async getAllWithFilesByActivity(activityId) {
    const conn = await pool.getConnection();
    try {
      // Obtener submissions junto con el nombre del usuario
      const [subs] = await conn.query(
        `SELECT s.*, u.Name AS UserName, u.Email AS UserEmail 
        FROM Submissions s
        JOIN Users u ON s.UserID = u.UserID
        WHERE s.ActivityID = ?
        ORDER BY s.SubmittedAt DESC`,
        [activityId]
      );

      const submissionIds = subs.map((s) => s.SubmissionID);
      if (submissionIds.length === 0) return [];

      const [files] = await conn.query(
        `SELECT * FROM Files WHERE SubmissionID IN (?)`,
        [submissionIds]
      );

      const filesBySubmission = {};
      files.forEach((file) => {
        if (!filesBySubmission[file.SubmissionID]) {
          filesBySubmission[file.SubmissionID] = [];
        }
        filesBySubmission[file.SubmissionID].push(file);
      });

      return subs.map((sub) => ({
        ...sub,
        files: filesBySubmission[sub.SubmissionID] || [],
      }));
    } finally {
      conn.release();
    }
  },

  // Crear nueva entrega
  async create(data) {
    const conn = await pool.getConnection();
    try {
      // Verificar si ya hay una entrega final del usuario en esa actividad
      const [[existingFinal]] = await conn.query(
        `SELECT SubmissionID FROM Submissions WHERE ActivityID = ? AND UserID = ? AND IsFinal = TRUE`,
        [data.ActivityID, data.UserID]
      );

      const isFirstFinal = !existingFinal; // Si no existe una entrega final, esta será la primera

      const result = await conn.query(
        `INSERT INTO Submissions 
      (ActivityID, UserID, AttemptNumber, Score, Feedback, GradedAt, SubmittedAt, IsFinal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.ActivityID,
          data.UserID,
          data.AttemptNumber,
          data.Score || null,
          data.Feedback || null,
          data.GradedAt || null,
          data.SubmittedAt || new Date(),
          isFirstFinal, // Solo true si no hay otra entrega final
        ]
      );

      return result[0].insertId;
    } finally {
      conn.release();
    }
  },

  async updateFeedback(submissionId, feedback) {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.query(
        `UPDATE Submissions SET Feedback = ?, GradedAt = ? WHERE SubmissionID = ?`,
        [feedback, new Date(), submissionId]
      );
      return result.affectedRows > 0;
    } finally {
      conn.release();
    }
  },
  // Obtener promedio por módulo y por curso
  // ✅ Arreglo correcto
  async getUserAverageByCourse(courseId, userId) {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT m.ModuleID, s.Score
        FROM Modules m
        JOIN Activities a ON a.ModuleID = m.ModuleID
        JOIN Submissions s ON s.ActivityID = a.ActivityID
        WHERE m.CourseID = ? AND s.UserID = ? AND s.IsFinal = 1 AND s.Score IS NOT NULL`,
        [courseId, userId]
      );

      // Agrupar por módulo
      const modules = {};
      for (const { ModuleID, Score } of rows) {
        if (!modules[ModuleID]) {
          modules[ModuleID] = { total: 0, count: 0 };
        }
        modules[ModuleID].total += parseFloat(Score);
        modules[ModuleID].count += 1;
      }

      const moduleAverages = Object.entries(modules).map(
        ([moduleId, data]) => ({
          moduleId,
          average:
            data.count > 0
              ? parseFloat((data.total / data.count).toFixed(2))
              : null,
        })
      );

      const validAverages = moduleAverages.filter((m) => m.average !== null);

      const courseAverage =
        validAverages.length > 0
          ? parseFloat(
              (
                validAverages.reduce((acc, m) => acc + m.average, 0) /
                validAverages.length
              ).toFixed(2)
            )
          : null;

      return {
        moduleAverages,
        courseAverage,
      };
    } finally {
      conn.release();
    }
  },

  // Marcar entrega como final
  async markAsFinal(submissionId, activityId, userId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE Submissions 
          SET IsFinal = FALSE 
          WHERE ActivityID = ? AND UserID = ?`,
        [activityId, userId]
      );

      await conn.query(
        `UPDATE Submissions 
          SET IsFinal = TRUE 
          WHERE SubmissionID = ?`,
        [submissionId]
      );

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },
};

module.exports = Submission;

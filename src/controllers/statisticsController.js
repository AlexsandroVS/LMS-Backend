const pool = require("../config/db");

// 1. Participación por curso (basado en archivos entregados)
exports.getParticipationByCourse = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.Title AS Curso,
        ROUND(COUNT(DISTINCT s.UserID) * 100 / (
          SELECT COUNT(*) FROM Users WHERE Role = 'student'
        ), 2) AS ParticipacionPorcentaje
      FROM Courses c
      JOIN Modules m ON c.CourseID = m.CourseID
      JOIN Activities a ON a.ModuleID = m.ModuleID
      JOIN Submissions s ON s.ActivityID = a.ActivityID
      WHERE s.IsFinal = 1
      GROUP BY c.CourseID;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en participación por curso:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 2. Promedio por curso (desde Submissions)
exports.getAverageScoreByCourse = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.Title AS Curso,
        ROUND(AVG(s.Score), 2) AS PromedioNotas
      FROM Courses c
      JOIN Modules m ON c.CourseID = m.CourseID
      JOIN Activities a ON a.ModuleID = m.ModuleID
      JOIN Submissions s ON s.ActivityID = a.ActivityID
      WHERE s.IsFinal = 1 AND s.Score IS NOT NULL
      GROUP BY c.CourseID;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en promedio por curso:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 3. Entregas por estudiante
exports.getSubmissionsByStudent = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.Name, COUNT(s.SubmissionID) AS Entregas
      FROM Users u
      LEFT JOIN Submissions s ON s.UserID = u.UserID
      WHERE u.Role = 'student'
      GROUP BY u.UserID
      ORDER BY Entregas DESC;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en entregas por estudiante:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 4. Cumplimiento por actividad
exports.getActivityCompliance = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.Title,
        COUNT(s.SubmissionID) AS Entregas,
        (SELECT COUNT(*) FROM Users WHERE Role = 'student') - COUNT(DISTINCT s.UserID) AS Faltantes
      FROM Activities a
      LEFT JOIN Submissions s ON s.ActivityID = a.ActivityID AND s.IsFinal = 1
      GROUP BY a.ActivityID;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en cumplimiento por actividad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 5. Top 5 actividades con menor cumplimiento
exports.getTopPendingActivities = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.Title,
        COUNT(s.SubmissionID) AS Entregas,
        (SELECT COUNT(*) FROM Users WHERE Role = 'student') AS TotalEstudiantes,
        (SELECT COUNT(*) FROM Users WHERE Role = 'student') - COUNT(DISTINCT s.UserID) AS Pendientes
      FROM Activities a
      LEFT JOIN Submissions s ON s.ActivityID = a.ActivityID AND s.IsFinal = 1
      GROUP BY a.ActivityID
      ORDER BY Pendientes DESC
      LIMIT 5;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en top de actividades con menor cumplimiento:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 6. Estudiantes con bajo rendimiento (Score promedio < 11)
exports.getLowPerformanceStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.Name,
        ROUND(AVG(s.Score), 2) AS Promedio
      FROM Users u
      JOIN Submissions s ON s.UserID = u.UserID
      WHERE u.Role = 'student' AND s.IsFinal = 1 AND s.Score IS NOT NULL
      GROUP BY u.UserID
      HAVING Promedio < 11;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en estudiantes con bajo rendimiento:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 7. Promedio global de un estudiante
exports.getGlobalAverage = async (req, res) => {
  const { userId } = req.params;
  try {
    const [[row]] = await pool.query(`
      SELECT ROUND(AVG(s.Score), 2) AS PromedioGlobal
      FROM Submissions s
      WHERE s.UserID = ? AND s.IsFinal = 1 AND s.Score IS NOT NULL;
    `, [userId]);

    res.json(row);
  } catch (error) {
    console.error("Error en promedio global del estudiante:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

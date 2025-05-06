// controllers/statisticsController.js (actualizado con mejoras sugeridas)
const pool = require("../config/db");

// 1. Participación por curso
exports.getParticipationByCourse = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.Title AS Curso,
        ROUND(COUNT(DISTINCT f.UserID) * 100 / (
          SELECT COUNT(*) FROM Users WHERE Role = 'student'
        ), 2) AS ParticipacionPorcentaje
      FROM Courses c
      JOIN Modules m ON c.CourseID = m.CourseID
      JOIN Activities a ON a.ModuleID = m.ModuleID
      LEFT JOIN Files f ON f.ActivityID = a.ActivityID
      GROUP BY c.CourseID;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en participación por curso:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 2. Promedio por curso
exports.getAverageScoreByCourse = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.Title AS Curso,
        ROUND(AVG(g.Score), 2) AS PromedioNotas
      FROM Courses c
      JOIN Modules m ON c.CourseID = m.CourseID
      JOIN Activities a ON a.ModuleID = m.ModuleID
      JOIN ActivityGrades g ON g.ActivityID = a.ActivityID
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
      SELECT u.Name, COUNT(f.FileID) AS Entregas
      FROM Users u
      LEFT JOIN Files f ON f.UserID = u.UserID
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
        COUNT(f.FileID) AS Entregas,
        (SELECT COUNT(*) FROM Users WHERE Role = 'student') - COUNT(f.FileID) AS Faltantes
      FROM Activities a
      LEFT JOIN Files f ON f.ActivityID = a.ActivityID
      GROUP BY a.ActivityID;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en cumplimiento por actividad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.getTopPendingActivities = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.Title,
        COUNT(f.FileID) AS Entregas,
        (SELECT COUNT(*) FROM Users WHERE Role = 'student') AS TotalEstudiantes,
        (SELECT COUNT(*) FROM Users WHERE Role = 'student') - COUNT(f.FileID) AS Pendientes
      FROM Activities a
      LEFT JOIN Files f ON f.ActivityID = a.ActivityID
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

// 5. Estudiantes con bajo rendimiento
exports.getLowPerformanceStudents = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.Name,
        ROUND(AVG(g.Score), 2) AS Promedio
      FROM Users u
      JOIN ActivityGrades g ON g.UserID = u.UserID
      WHERE u.Role = 'student'
      GROUP BY u.UserID
      HAVING Promedio < 11;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error en estudiantes con bajo rendimiento:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 6. Promedio general del estudiante
exports.getGlobalAverage = async (req, res) => {
  const { userId } = req.params;
  try {
    const [[row]] = await pool.query(`
      SELECT ROUND(AVG(Score), 2) AS PromedioGlobal
      FROM ActivityGrades
      WHERE UserID = ? AND Score IS NOT NULL
    `, [userId]);

    res.json(row);
  } catch (error) {
    console.error("Error en promedio global del estudiante:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

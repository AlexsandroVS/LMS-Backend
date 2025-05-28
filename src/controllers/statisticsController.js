const pool = require("../config/db");

// 1. Promedio de notas por módulo en un curso específico
exports.getModuleAveragesByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.ModuleID,
        m.Title AS Modulo,
        ROUND(AVG(s.Score), 2) AS PromedioNotas,
        COUNT(DISTINCT s.UserID) AS EstudiantesEvaluados
      FROM Modules m
      JOIN Activities a ON m.ModuleID = a.ModuleID
      LEFT JOIN Submissions s ON a.ActivityID = s.ActivityID AND s.IsFinal = 1 AND s.Score IS NOT NULL
      WHERE m.CourseID = ?
      GROUP BY m.ModuleID, m.Title
      ORDER BY m.ModuleOrder;
    `, [courseId]);
    
    res.json(rows);
  } catch (error) {
    console.error("Error en promedio por módulo:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 2. Estudiantes con bajo rendimiento en un curso específico (Score promedio < 11)
exports.getLowPerformanceStudentsByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.UserID,
        u.Name,
        ROUND(AVG(s.Score), 2) AS Promedio,
        COUNT(s.SubmissionID) AS Entregas
      FROM Users u
      JOIN Enrollments e ON u.UserID = e.StudentID
      JOIN Assignments a ON e.AssignmentID = a.AssignmentID
      JOIN Submissions s ON u.UserID = s.UserID
      JOIN Activities act ON s.ActivityID = act.ActivityID
      JOIN Modules m ON act.ModuleID = m.ModuleID
      WHERE 
        u.Role = 'student' 
        AND a.CourseID = ?
        AND s.IsFinal = 1 
        AND s.Score IS NOT NULL
      GROUP BY u.UserID, u.Name
      HAVING Promedio < 11
      ORDER BY Promedio ASC
      LIMIT 5;
    `, [courseId]);
    
    res.json(rows);
  } catch (error) {
    console.error("Error en estudiantes con bajo rendimiento:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 3. Estudiantes con mejor rendimiento en un curso específico
exports.getTopPerformanceStudentsByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.UserID,
        u.Name,
        ROUND(AVG(s.Score), 2) AS Promedio,
        COUNT(s.SubmissionID) AS Entregas
      FROM Users u
      JOIN Enrollments e ON u.UserID = e.StudentID
      JOIN Assignments a ON e.AssignmentID = a.AssignmentID
      JOIN Submissions s ON u.UserID = s.UserID
      JOIN Activities act ON s.ActivityID = act.ActivityID
      JOIN Modules m ON act.ModuleID = m.ModuleID
      WHERE 
        u.Role = 'student' 
        AND a.CourseID = ?
        AND s.IsFinal = 1 
        AND s.Score IS NOT NULL
      GROUP BY u.UserID, u.Name
      HAVING Promedio >= 11
      ORDER BY Promedio DESC
      LIMIT 5;
    `, [courseId]);
    
    res.json(rows);
  } catch (error) {
    console.error("Error en estudiantes con mejor rendimiento:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 4. Actividades con bajo número de entregas en un curso específico
exports.getLowCompletionActivitiesByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.ActivityID,
        a.Title AS Actividad,
        m.Title AS Modulo,
        COUNT(DISTINCT s.UserID) AS Entregas,
        (SELECT COUNT(DISTINCT e.StudentID) 
         FROM Enrollments e
         JOIN Assignments a2 ON e.AssignmentID = a2.AssignmentID
         WHERE a2.CourseID = ?) AS TotalEstudiantes,
        (SELECT COUNT(DISTINCT e.StudentID) 
         FROM Enrollments e
         JOIN Assignments a2 ON e.AssignmentID = a2.AssignmentID
         WHERE a2.CourseID = ?) - COUNT(DISTINCT s.UserID) AS Pendientes
      FROM Activities a
      JOIN Modules m ON a.ModuleID = m.ModuleID
      LEFT JOIN Submissions s ON a.ActivityID = s.ActivityID AND s.IsFinal = 1
      WHERE m.CourseID = ?
      GROUP BY a.ActivityID, a.Title, m.Title
      ORDER BY Pendientes DESC
      LIMIT 5;
    `, [courseId, courseId, courseId]);
    
    res.json(rows);
  } catch (error) {
    console.error("Error en actividades con bajo cumplimiento:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// 5. Obtener lista de cursos para el filtro
exports.getCoursesForFilter = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.CourseID, c.Title 
      FROM Courses c
      ORDER BY c.Title;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo cursos:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
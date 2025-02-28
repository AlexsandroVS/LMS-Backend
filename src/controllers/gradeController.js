const Grade = require("../models/Grade");
const pool = require("../config/db");
const Activity = require("../models/Activity"); // Asegúrate de que la ruta esté correcta

exports.gradeUserActivity = async (req, res) => {
  try {
    const { userId, activityId } = req.params;
    const { score } = req.body;

    // Validar permisos (ej: solo profesores pueden calificar)
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ error: "No tienes permisos para calificar" });
    }

    // Validar que el usuario a calificar existe
    const [user] = await pool.query("SELECT UserID FROM Users WHERE UserID = ?", [userId]);
    if (!user.length) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Calificar la actividad
    const result = await Grade.gradeActivity(userId, activityId, score);

    if (result) {
      // Obtener la actividad y sus promedios actualizados
      const [activity] = await pool.query(
        `SELECT m.ModuleID FROM Activities a
        JOIN Modules m ON a.ModuleID = m.ModuleID
        WHERE a.ActivityID = ?`, [activityId]
      );
      
      if (!activity.length) {
        return res.status(404).json({ error: "Actividad no encontrada" });
      }

      const averages = await Grade.calculateAverages(userId, activity[0].ModuleID);

      return res.json({
        success: true,
        message: "Calificación registrada o actualizada",
        userAverages: averages,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.updateActivityGrade = async (req, res) => {
  try {
    const { userId, activityId } = req.params;
    const { score } = req.body;

    // Verificar si la actividad existe y obtener los datos relacionados
    const [activityData] = await pool.query(
      `SELECT m.CourseID, a.ModuleID 
       FROM Activities a
       JOIN Modules m ON a.ModuleID = m.ModuleID
       WHERE a.ActivityID = ?`,
      [activityId]
    );

    if (!activityData || activityData.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    const { CourseID, ModuleID } = activityData[0];

    // Actualizar o insertar la calificación en ActivityGrades
    await pool.query(
      `INSERT INTO ActivityGrades (UserID, ActivityID, Score)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           Score = ?, 
           GradedAt = NOW()`,
      [userId, activityId, score, score]
    );

    // Actualizar el progreso del usuario
    await pool.query(
      `INSERT INTO UserProgress (
        UserID, CourseID, ModuleID, ActivityID, 
        Status, Score
      ) VALUES (?, ?, ?, ?, 'completed', ?)
      ON DUPLICATE KEY UPDATE
        Status = 'completed',
        Score = VALUES(Score)`,
      [userId, CourseID, ModuleID, activityId, score]
    );

    res.json({
      success: true,
      message: "Calificación actualizada correctamente",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener promedios para frontend
exports.getAverages = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const averages = await Grade.calculateAverages(userId, courseId);

    res.json({
      success: true,
      data: {
        courseAverage: averages.course,
        modules: averages.modules.map((m) => ({
          moduleId: m.ModuleID,
          average: m.Average,
          totalActivities: m.TotalActivities, // Total en el módulo
          gradedActivities: m.GradedActivities, // Calificadas
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Modificar getActivityGrade para retornar "N/A" si no hay calificación
exports.getActivityGrade = async (req, res) => {
  try {
    const { userId, activityId } = req.params;

    // Consultar la calificación de la actividad para el usuario
    const [grade] = await pool.query(
      `SELECT Score FROM ActivityGrades WHERE UserID = ? AND ActivityID = ?`,
      [userId, activityId]
    );

    // Si no se encuentra calificación, retornar "N/A"
    if (!grade.length) {
      return res.json({
        success: true,
        data: "N/A" // Si no hay calificación, devolver N/A
      });
    }

    res.json({
      success: true,
      data: grade[0].Score
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Modificar gradeSubmission para que no sea obligatorio tener calificación antes de registrar
exports.gradeSubmission = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { score } = req.body;

    // 1. Obtener datos del archivo
    const [file] = await pool.query(
      `SELECT UserID, ActivityID, CourseID 
         FROM Files WHERE FileID = ?`,
      [fileId]
    );

    if (!file.length) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    const { UserID, ActivityID, CourseID } = file[0];

    // 2. Calificar actividad (si no existe, se crea; si ya existe, se actualiza)
    await Grade.gradeActivity(UserID, ActivityID, score);

    // 3. Obtener promedios actualizados
    const averages = await Grade.calculateAverages(UserID, CourseID);

    res.json({
      success: true,
      activityScore: score,
      moduleAverages: averages.modules,
      courseAverage: averages.course,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

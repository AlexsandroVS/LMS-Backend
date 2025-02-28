const pool = require("../config/db");
const Grade = {
  // Calificar actividad: crear o actualizar calificación
  async gradeActivity(userId, activityId, score) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Obtener CourseID y ModuleID relacionados
      const [activityData] = await conn.query(
        `
          SELECT m.CourseID, a.ModuleID 
          FROM Activities a
          JOIN Modules m ON a.ModuleID = m.ModuleID
          WHERE a.ActivityID = ?
        `,
        [activityId]
      );

      if (!activityData || activityData.length === 0) {
        throw new Error("Actividad no encontrada");
      }

      const { CourseID, ModuleID } = activityData[0];

      // 2. Registrar o actualizar calificación
      await conn.query(
        `INSERT INTO ActivityGrades (UserID, ActivityID, Score)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            Score = VALUES(Score),
            GradedAt = NOW()`,
        [userId, activityId, score]
      );

      // 3. Actualizar UserProgress con las claves foráneas
      await conn.query(
        `
          INSERT INTO UserProgress (
            UserID, CourseID, ModuleID, ActivityID, 
            Status, Score
          ) VALUES (?, ?, ?, ?, 'completed', ?)
          ON DUPLICATE KEY UPDATE
            Status = 'completed',
            Score = VALUES(Score)`,
        [userId, CourseID, ModuleID, activityId, score]
      );

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  // Calcular promedios de las actividades
  async calculateAverages(userId, courseId) {
    const conn = await pool.getConnection();
    try {
      const [modules] = await conn.query(`
        SELECT 
          m.ModuleID,
          ROUND(COALESCE(AVG(ag.Score), 0), 1) AS Average,
          COUNT(a.ActivityID) AS TotalActivities,
          COUNT(ag.Score) AS GradedActivities
        FROM Modules m
        LEFT JOIN Activities a ON m.ModuleID = a.ModuleID
        LEFT JOIN ActivityGrades ag 
          ON a.ActivityID = ag.ActivityID 
          AND ag.UserID = ?  -- Filtro por UserID
        WHERE m.CourseID = ?
        GROUP BY m.ModuleID
      `, [userId, courseId]);

      const courseAverage = modules.reduce((acc, curr) => {
        return acc + (parseFloat(curr.Average) * curr.GradedActivities);
      }, 0) / modules.reduce((acc, curr) => acc + curr.GradedActivities, 0) || 0;

      return {
        modules: modules.map(m => ({
          ...m,
          Average: parseFloat(m.Average),
          TotalActivities: parseInt(m.TotalActivities),
          GradedActivities: parseInt(m.GradedActivities)
        })),
        course: parseFloat(courseAverage.toFixed(1))
      };
    } finally {
      conn.release();
    }
  }
};

module.exports = Grade;

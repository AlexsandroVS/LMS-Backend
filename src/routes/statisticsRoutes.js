const express = require("express");
const router = express.Router();
const stats = require("../controllers/statisticsController");

// Estadísticas generales
router.get("/participacion-por-curso", stats.getParticipationByCourse);
router.get("/promedio-por-curso", stats.getAverageScoreByCourse);
router.get("/entregas-por-estudiante", stats.getSubmissionsByStudent);
router.get("/cumplimiento-por-actividad", stats.getActivityCompliance);
router.get("/bajo-rendimiento", stats.getLowPerformanceStudents);
router.get("/top-pending-activities", stats.getTopPendingActivities);


// Promedio global individual
router.get("/global-average/:userId", stats.getGlobalAverage);

module.exports = router;

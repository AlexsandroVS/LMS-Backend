const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const {
  gradeSubmission,
  getAverages,
  updateActivityGrade,
  gradeUserActivity,
  getActivityGrade,
} = require("../controllers/gradeController");

// routes/grade.js
router.get("/user/:userId/course/:courseId/averages", getAverages);

router.get(
  "/user/:userId/activity/:activityId/",
  protect, // Solo usuarios autenticados pueden acceder
  getActivityGrade // Controlador que obtiene la calificación de la actividad
);
router.put(
  "/user/:userId/activity/:activityId", 
  protect, // Middleware de protección (verifica que el usuario esté autenticado)
  restrictTo("admin", "teacher"), // Solo los admin y teachers pueden actualizar la calificación
  updateActivityGrade // Función que actualiza la calificación
);


router.post("/:fileId", protect, restrictTo("admin"), gradeSubmission);
router.post(
  "/user/:userId/activity/:activityId",
  protect,
  restrictTo("admin"),
  gradeUserActivity
);

module.exports = router;

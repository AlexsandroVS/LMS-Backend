const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const {
  createOrUpdateProgress,
  getUserProgress,
  getFullProgress,
  getCourseSummary,
  listEnrollments
} = require("../controllers/progressController");

// Todas las rutas protegidas
router.use(protect);

// Progreso de usuario
router.post(
  "/:userId/course/:courseId/module/:moduleId/activity/:activityId",
  restrictTo("admin", "teacher"),
  createOrUpdateProgress
);
router.get("/:userId/course/:courseId/full", protect, getFullProgress);

router.get("/:userId/course/:courseId/summary", protect, getCourseSummary);

router.get("/:userId/course/:courseId", getUserProgress);

// Inscripciones (solo admin)
router.get("/enrollments", restrictTo("admin"), listEnrollments);

module.exports = router;
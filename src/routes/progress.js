const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const {
  createOrUpdateProgress,
  getUserProgress,
  getFullProgress,
  getCourseSummary,
  listEnrollments,
  getUserCoursesWithProgress
} = require("../controllers/progressController");

// ❗Esta ruta NO requiere protección
router.get("/:userId", getUserCoursesWithProgress);

// Aplicar protección para el resto
router.use(protect);

// Estas sí están protegidas
router.get("/:userId/course/:courseId/full", getFullProgress);
router.get("/:userId/course/:courseId/summary", getCourseSummary);
router.get("/:userId/course/:courseId", getUserProgress);
router.post(
  "/:userId/course/:courseId/module/:moduleId/activity/:activityId",
  restrictTo("admin", "teacher"),
  createOrUpdateProgress
);
router.get("/enrollments", restrictTo("admin"), listEnrollments);

module.exports = router;

// routes/enrollments.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/enrollmentController");
const Enrollment = require('../models/Enrollment');

router.get('/students-by-teacher/:teacherId', async (req, res) => {
  const { teacherId } = req.params;
  try {
    const students = await Enrollment.getUniqueStudentsByTeacher(teacherId);
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener estudiantes' });
  }
});

router.get("/", controller.getAllEnrollments);
router.get("/:id", controller.getEnrollmentById);
router.post("/", controller.createEnrollment);
router.put("/:id", controller.updateEnrollment);
router.delete("/:id", controller.deleteEnrollment);
router.get("/student/:studentId/courses", controller.getCoursesByStudent);

module.exports = router;

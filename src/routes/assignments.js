// routes/assignments.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/assignmentController");
const Assignment = require('../models/Assignment');

router.get('/teacher/:teacherId/students', controller.getStudentsByTeacher);


router.get("/", controller.getAllAssignments);
router.get("/:id", controller.getAssignmentById);
router.post("/", controller.createAssignment);
router.put("/:id", controller.updateAssignment);
router.delete("/:id", controller.deleteAssignment);

module.exports = router;

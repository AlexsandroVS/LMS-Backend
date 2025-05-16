// routes/enrollments.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/enrollmentController");

router.get("/", controller.getAllEnrollments);
router.get("/:id", controller.getEnrollmentById);
router.post("/", controller.createEnrollment);
router.put("/:id", controller.updateEnrollment);
router.delete("/:id", controller.deleteEnrollment);

module.exports = router;

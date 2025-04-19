const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');

// Multer para imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get("/", getAllCourses);
router.get("/:id", getCourseById);
router.post("/", upload.single("image"), createCourse);
router.put("/:id", upload.single("image"), updateCourse);
router.delete("/:id", deleteCourse);

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect, restrictTo } = require('../middlewares/auth'); // ✅ Importar middlewares

const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getRelatedSearches,
  getSearchSuggestions
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

// ✅ Rutas públicas
router.get('/search/suggestions', getSearchSuggestions);
router.get('/related', getRelatedSearches);
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// ✅ Rutas protegidas
router.post("/", protect, restrictTo('admin', 'docente'), upload.single("image"), createCourse);
router.put("/:id", protect, restrictTo('admin', 'docente'), upload.single("image"), updateCourse);
router.delete("/:id", protect, restrictTo('admin'), deleteCourse);

module.exports = router;

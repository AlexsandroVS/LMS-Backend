// filesRoutes.js
const express = require("express");
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const filesController = require("../controllers/filesController");
const { protect } = require("../middlewares/auth");

// Configuración de multer para manejar archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const courseId = req.params.courseId; // Obtener el ID del curso desde los parámetros de la URL
    const courseName = await getCourseName(courseId); // Obtener el nombre del curso
    const subFolder = courseName.split(' ')[0]; // Tomar la primera palabra del nombre del curso

    // Crear la ruta para la subcarpeta dentro del directorio "documents"
    const dirPath = path.join(__dirname, '..', '..', 'documents', subFolder);

    // Si la carpeta no existe, la creamos
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Indicamos que los archivos se guardarán en la carpeta correspondiente
    cb(null, dirPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Guardar con nombre único
  },
});

const upload = multer({ storage: storage });
async function getCourseName(courseId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT Title FROM Courses WHERE CourseID = ?`,
      [courseId]
    );
    return rows.length > 0 ? rows[0].Title : 'Curso Desconocido';
  } finally {
    conn.release();
  }
}

// Subir archivo para una actividad 
router.post(
  "/courses/:courseId/modules/:moduleId/activities/:activityId/files",
  protect, // Aquí es donde se asegura la autenticación
  upload.single("file"),
  filesController.uploadFile
);

// Obtener archivos asociados a una actividad
router.get(
  "/activities/:activityId/files",
  protect, // Asegúrate de que protect esté aplicado
  filesController.getFilesByActivityId
);
router.get("/files/:id", filesController.getFileById);
// Eliminar un archivo
router.delete("/files/:id", protect, filesController.deleteFile);
router.patch("/files/:id/feedback", filesController.addFeedback);
router.patch("/files/:id/score", filesController.updateScore);

module.exports = router;

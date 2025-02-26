const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const multer = require("multer"); // Importa multer para manejar la carga de archivos
const activitiesController = require("../controllers/activitiesController");
const filesController = require("../controllers/filesController");
const { protect } = require("../middlewares/auth");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const courseId = req.params.courseId; // Obtener el ID del curso desde los parámetros de la URL
    const courseName = await getCourseName(courseId); // Obtener el nombre del curso
    const subFolder = courseName.split(" ")[0]; // Tomar la primera palabra del nombre del curso

    // Crear la ruta para la subcarpeta dentro del directorio "documents"
    const dirPath = path.join(__dirname, "..", "..", "documents", subFolder);

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

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/webm",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Permite el archivo
    } else {
      cb(
        new Error(
          "Tipo de archivo no permitido. Solo se permiten PDF, Word, imágenes y videos."
        )
      ); // Rechaza el archivo
    }
  },
});

async function getCourseName(courseId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT Title FROM Courses WHERE CourseID = ?`,
      [courseId]
    );
    return rows.length > 0 ? rows[0].Title : "Curso Desconocido";
  } finally {
    conn.release();
  }
}

// Obtener todas las actividades de un módulo
router.get(
  "/courses/:courseId/modules/:moduleId/activities",
  activitiesController.getAllModuleActivities
);

// Obtener una actividad por su ID
router.get("/activities/:id", activitiesController.getActivityById);

router.get(
  "/activities/:activityId/files",
  filesController.getFilesByActivityId
);
// Crear una actividad en un módulo
router.post(
  "/courses/:courseId/modules/:moduleId/activities",
  protect,
  upload.single("file"),
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: "Error en la carga del archivo",
        error: err.message,
      });
    }
    next(err);
  },
  activitiesController.createActivity
);

// Actualizar una actividad
router.put("/activities/:id", activitiesController.updateActivity);

// Eliminar una actividad
router.delete("/activities/:id", activitiesController.deleteActivity);

module.exports = router;

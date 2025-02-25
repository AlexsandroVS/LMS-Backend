const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer"); // Importa multer para manejar la carga de archivos
const activitiesController = require("../controllers/activitiesController");
const filesController = require("../controllers/filesController");
const { protect } = require("../middlewares/auth");

// Configuración de multer para manejar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const courseId = req.params.courseId; // Obtener el ID del curso desde los parámetros de la URL
    const subFolder = `documents/${courseId}`; // Crear una subcarpeta para el curso (opcional)

    // Si la carpeta no existe, la creamos
    if (!fs.existsSync(subFolder)) {
      fs.mkdirSync(subFolder, { recursive: true });
    }

    // Indicamos que los archivos se guardarán en la carpeta correspondiente
    cb(null, subFolder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Asignar un nombre único al archivo
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite de 10MB para el tamaño de los archivos
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Tipo de archivo no permitido. Solo se permiten PDF, Word, JPEG y PNG."
        )
      ); // Error si el archivo no es permitido
    }
  },
});

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

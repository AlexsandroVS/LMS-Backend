// filesRoutes.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const filesController = require("../controllers/filesController");
const { protect } = require("../middlewares/auth");

// Configuración de multer para manejar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Definimos la ruta de destino para los archivos cargados
    const courseId = req.params.courseId; // Obtener el ID del curso desde los parámetros de la URL
    const subFolder = `documents/${courseId}`; // Creamos una subcarpeta para el curso (opcional)

    // Si la carpeta no existe, la creamos
    if (!fs.existsSync(subFolder)) {
      fs.mkdirSync(subFolder, { recursive: true });
    }

    // Indicamos que los archivos se guardarán en la carpeta correspondiente
    cb(null, subFolder);
  },
  filename: (req, file, cb) => {
    // Le damos un nombre único al archivo usando la fecha y el nombre original
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const allowedTypes = [
  "application/pdf", // PDF
  "application/msword", // Word (.doc)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Word (.docx)
  "image/jpeg", // JPEG
  "image/png", // PNG
];

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido. Solo se permiten PDF, Word, JPEG y PNG."));
    }
  },
});

// Subir archivo para una actividad (ruta correcta)
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

module.exports = router;

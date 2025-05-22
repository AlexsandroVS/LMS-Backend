// filesRoutes.js
const express = require("express");
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const filesController = require("../controllers/filesController");
const { protect } = require("../middlewares/auth");

function sanitizeFolderName(name) {
  return name
    .split(" ")[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-zA-Z0-9]/g, "")    
    .toUpperCase(); 
}
async function getCourseName(courseId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT Title FROM Courses WHERE CourseID = ?`,
      [courseId]
    );
    return rows.length > 0 ? rows[0].Title : 'CursoDesconocido';
  } finally {
    conn.release();
  }
}

// Configuración de multer para manejar archivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const courseId = req.params.courseId;
      const courseName = await getCourseName(courseId);
      const subFolder = sanitizeFolderName(courseName);

      const dirPath = path.join(__dirname, '..', '..', 'documents', subFolder);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      cb(null, dirPath);
    } catch (err) {
      cb(err, null);
    }
  },

  filename: async (req, file, cb) => {
    try {
      const courseId = req.params.courseId;
      const courseName = await getCourseName(courseId);
      const subFolder = sanitizeFolderName(courseName);
      const dirPath = path.join(__dirname, '..', '..', 'documents', subFolder);

      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);

      let finalName = `${baseName}${ext}`;
      let counter = 1;
      while (fs.existsSync(path.join(dirPath, finalName))) {
        finalName = `${baseName}-${counter}${ext}`;
        counter++;
      }

      cb(null, finalName);
    } catch (err) {
      cb(err, "");
    }
  }
});



const upload = multer({ storage: storage });
const uploadMemory = multer({ storage: multer.memoryStorage() });
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

router.post(
  "/submissions/:submissionId/files",
  protect,
  uploadMemory.single("file"), // ✅ usa memoryStorage
  filesController.uploadFileBySubmission
);

router.get(
  "/submissions/:submissionId/files",
  protect,
  filesController.getFilesBySubmissionId
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
router.patch("/files/:id/score", filesController.updateScore);

module.exports = router;

const Activity = require("../models/Activity");
const File = require("../models/Files");
const multer = require("multer");
const storage = multer.memoryStorage();
const pool = require("../config/db");
const path = require("path");
const libre = require("libreoffice-convert");
const fs = require("fs");
const upload = multer({ storage: storage });

exports.getAllModuleActivities = async (req, res) => {
  const { moduleId } = req.params;

  try {
    const activities = await Activity.getAllByModuleId(moduleId);
    res.status(200).json(activities || []);
  } catch (error) {
    console.error("❌ Error al obtener actividades:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.getActivityById = async (req, res) => {
  const { id } = req.params;
  try {
    const activity = await Activity.getById(id);
    if (!activity) {
      return res.status(404).json({ message: "Actividad no encontrada." });
    }
    res.json(activity);
  } catch (error) {
    console.error("❌ Error al obtener actividad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.createActivity = async (req, res) => {
  const { moduleId, courseId } = req.params;
  const { title, content, deadline, maxSubmissions } = req.body;
  const files = req.files;

  try {
    if (!moduleId || !title || !content) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const deadlineDate = deadline ? new Date(deadline) : null;

    const activityData = {
      ModuleID: moduleId,
      Title: title,
      Content: content,
      Deadline: deadlineDate,
      MaxSubmissions: maxSubmissions || 1,
    };

    const activityId = await Activity.create(activityData);
    const courseName = await getCourseName(courseId);
    const subFolder = courseName.split(" ")[0];
    const dirPath = path.join("documents", subFolder);

    const savedFiles = [];

    for (const file of files) {
      const inputPath = path.join(dirPath, file.filename);
      const fileBuffer = fs.readFileSync(inputPath); 

      let finalFilename = file.filename;
      let finalMimetype = file.mimetype;

      // Convertir a PDF si es un documento compatible
      if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/msword" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        file.mimetype === "application/vnd.ms-powerpoint"
      ) {
        const outputPath = inputPath.replace(path.extname(inputPath), ".pdf");

        try {
          const pdfBuffer = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, ".pdf", undefined, (err, done) => {
              if (err) reject(err);
              else resolve(done);
            });
          });

          fs.writeFileSync(outputPath, pdfBuffer);
          fs.unlinkSync(inputPath); // eliminar el original

          finalFilename = path.basename(outputPath);
          finalMimetype = "application/pdf";
        } catch (err) {
          console.error("❌ Error convirtiendo archivo a PDF:", err);
          continue; // saltar este archivo si falla la conversión
        }
      }

      const relativeFilePath = path.join("documents", subFolder, finalFilename);

      const fileData = {
        ActivityID: activityId,
        UserID: req.user.id,
        CourseID: courseId,
        FileName: file.originalname,
        FileType: finalMimetype,
        Files: relativeFilePath,
        UploadedAt: new Date(),
      };

      const fileId = await File.create(fileData);
      savedFiles.push({ id: fileId, name: file.originalname });
    }

    res.status(201).json({
      message: "Actividad y archivos creados exitosamente",
      activity: { id: activityId, title },
      files: savedFiles,
    });

  } catch (error) {
    console.error("❌ Error en createActivity:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


exports.updateActivity = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ error: "Debe proporcionar al menos un campo para actualizar" });
    }

    const result = await Activity.update(req.params.id, req.body);
    if (!result) {
      return res.status(404).json({ message: "Actividad no encontrada." });
    }

    res.json({ message: "Actividad actualizada exitosamente" });
  } catch (error) {
    console.error("❌ Error al actualizar actividad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.deleteActivity = async (req, res) => {
  const { id } = req.params;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("DELETE FROM Activities WHERE ActivityID = ?", [id]);
      await conn.commit();
      res.json({ message: "Actividad eliminada exitosamente" });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("❌ Error al eliminar actividad:", error);
    res.status(500).json({ message: "Error al eliminar actividad" });
  }
};


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

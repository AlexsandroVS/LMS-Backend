const File = require("../models/Files");
const fs = require("fs");
const pool = require("../config/db");
const path = require("path");
const libre = require("libreoffice-convert");

function sanitizeFolderName(name) {
  return name
    .split(" ")[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}
// Subir archivo normal (actividad sin submission)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo." });
    }

    const { activityId } = req.params;
    const conn = await pool.getConnection();

    try {
      const [activityData] = await conn.query(
        `SELECT m.CourseID, a.MaxSubmissions, c.Title
         FROM Activities a
         JOIN Modules m ON a.ModuleID = m.ModuleID
         JOIN Courses c ON c.CourseID = m.CourseID
         WHERE a.ActivityID = ?`,
        [activityId]
      );

      if (!activityData.length) {
        return res.status(400).json({ message: "Actividad no encontrada." });
      }

      const courseId = activityData[0].CourseID;
      const courseTitle = activityData[0].Title;
      const subFolder = sanitizeFolderName(activityData[0].Title);

      const maxSubmissions = activityData[0].MaxSubmissions || 1;

      const [attempts] = await conn.query(
        `SELECT COUNT(*) AS total FROM Files WHERE UserID = ? AND ActivityID = ?`,
        [req.user.id, activityId]
      );

      if (attempts[0].total >= maxSubmissions) {
        return res.status(403).json({
          message: `Has alcanzado el máximo de ${maxSubmissions} intentos para esta actividad.`,
        });
      }

      const uploadDir = path.join(
        __dirname,
        "..",
        "..",
        "documents",
        subFolder
      );
      const { filename, mimetype } = req.file;
      let finalFilename = filename;
      let finalMimetype = mimetype;
      const originalPath = path.join(uploadDir, filename);

      if (
        mimetype.includes("word") ||
        mimetype.includes("powerpoint") ||
        mimetype === "application/msword" ||
        mimetype === "application/vnd.ms-powerpoint"
      ) {
        const outputPath = originalPath.replace(
          path.extname(originalPath),
          ".pdf"
        );
        try {
          const fileBuffer = fs.readFileSync(originalPath);
          const pdfBuffer = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, ".pdf", undefined, (err, done) => {
              if (err) reject(err);
              else resolve(done);
            });
          });

          fs.writeFileSync(outputPath, pdfBuffer);
          fs.unlinkSync(originalPath);
          finalFilename = path.basename(outputPath);
          finalMimetype = "application/pdf";
        } catch (error) {
          console.error("Error al convertir archivo a PDF:", error);
          return res
            .status(500)
            .json({ message: "Error al convertir archivo a PDF." });
        }
      }

      const newFile = await File.create({
        ActivityID: activityId,
        UserID: req.user.id,
        CourseID: courseId,
        FileName: finalFilename,
        FileType: finalMimetype,
        Files: `documents/${subFolder}/${finalFilename}`,
        UploadedAt: new Date(),
        SubmissionID: null,
      });

      res.status(201).json(newFile);
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error al subir archivo:", error);
    res.status(500).json({ message: "Error interno al subir archivo." });
  }
};
// Subir archivo ligado a una submission
exports.uploadFileBySubmission = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se subió ningún archivo." });
    }

    const { submissionId } = req.params;

    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(
        `SELECT s.*, c.Title
         FROM Submissions s
         JOIN Activities a ON a.ActivityID = s.ActivityID
         JOIN Modules m ON m.ModuleID = a.ModuleID
         JOIN Courses c ON c.CourseID = m.CourseID
         WHERE s.SubmissionID = ?`,
        [submissionId]
      );

      if (!rows.length) {
        return res
          .status(404)
          .json({ message: "Entrega no encontrada." });
      }

      const submission = rows[0];
      const {
        ActivityID: activityId,
        UserID: userId,
        Title: courseTitle,
      } = submission;

      const subFolder = sanitizeFolderName(courseTitle);
      const uploadDir = path.join(__dirname, "..", "..", "documents", subFolder);

      // Crear carpeta si no existe
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname);
      const baseName = path.basename(req.file.originalname, ext);
      let finalFilename = `${baseName}${ext}`;
      let finalMimetype = req.file.mimetype;

      // Asegurar que el nombre sea único si ya existe
      let counter = 1;
      while (fs.existsSync(path.join(uploadDir, finalFilename))) {
        finalFilename = `${baseName}-${counter}${ext}`;
        counter++;
      }

      const originalPath = path.join(uploadDir, finalFilename);

      // Escribir el archivo desde memoria
      fs.writeFileSync(originalPath, req.file.buffer);

      // Convertir a PDF si es Word/PPT
      if (
        finalMimetype.includes("word") ||
        finalMimetype.includes("powerpoint") ||
        finalMimetype === "application/msword" ||
        finalMimetype === "application/vnd.ms-powerpoint"
      ) {
        const outputPath = originalPath.replace(ext, ".pdf");
        try {
          const fileBuffer = fs.readFileSync(originalPath);
          const pdfBuffer = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, ".pdf", undefined, (err, done) => {
              if (err) reject(err);
              else resolve(done);
            });
          });

          fs.writeFileSync(outputPath, pdfBuffer);
          fs.unlinkSync(originalPath); // eliminar original
          finalFilename = path.basename(outputPath);
          finalMimetype = "application/pdf";
        } catch (error) {
          console.error("Error al convertir archivo a PDF:", error);
          return res
            .status(500)
            .json({ message: "Error al convertir archivo a PDF." });
        }
      }

      const fileData = {
        ActivityID: activityId,
        UserID: userId,
        CourseID: null,
        FileName: finalFilename,
        FileType: finalMimetype,
        Files: `documents/${subFolder}/${finalFilename}`,
        UploadedAt: new Date(),
        SubmissionID: submissionId,
      };

      const newFileId = await File.create(fileData);

      res.status(201).json({
        message: "Archivo subido y convertido correctamente.",
        fileId: newFileId,
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error al subir archivo a entrega:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor." });
  }
};


async function getDocumentUploadPath(courseId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT Title FROM Courses WHERE CourseID = ?`,
      [courseId]
    );
    const courseName = rows.length > 0 ? rows[0].Title : "Curso";
    const subFolder = courseName.split(" ")[0].replace(/[^a-zA-Z0-9]/g, ""); // sanitizar
    const dirPath = path.join(__dirname, "..", "..", "documents", subFolder);

    // Asegúrate de que exista
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    return dirPath;
  } finally {
    conn.release();
  }
}

exports.getFileById = async (req, res) => {
  const { id } = req.params;
  try {
    const file = await File.getById(id);
    if (!file) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    // Construir la ruta completa del archivo
    const filePath = path.join(__dirname, "..", "..", file.Files);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ message: "Archivo no encontrado en el servidor" });
    }

    // Configurar headers para la descarga
    res.setHeader("Content-Type", file.FileType);
    res.setHeader("Content-Disposition", `inline; filename="${file.FileName}"`); // Usar "inline" para reproducir en el navegador

    // Enviar el archivo como un stream
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("❌ Error al obtener archivo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
exports.getFilesByActivityId = async (req, res) => {
  const { activityId } = req.params;

  try {
    const files = await File.getByActivityId(activityId);
    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron archivos para esta actividad." });
    }

    res.json(files); // Retorna los archivos asociados a la actividad
  } catch (error) {
    console.error("❌ Error al obtener archivos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
// Eliminar archivo
exports.deleteFile = async (req, res) => {
  const { id } = req.params;

  try {
    const conn = await pool.getConnection();

    // Verificar si el archivo existe antes de intentar eliminarlo
    const [file] = await conn.query("SELECT * FROM Files WHERE FileID = ?", [
      id,
    ]);
    if (file.length === 0) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    // Eliminar archivo de la base de datos
    const result = await conn.query("DELETE FROM Files WHERE FileID = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    // Eliminar el archivo físicamente si es necesario (opcional)
    const filePath = path.join(__dirname, "..", "..", file[0].Files);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Elimina el archivo físicamente
    }

    res.status(200).json({ message: "Archivo eliminado correctamente" });

    conn.release();
  } catch (error) {
    console.error("Error al eliminar archivo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
exports.getFilesBySubmissionId = async (req, res) => {
  const { submissionId } = req.params;

  try {
    const files = await File.getBySubmissionId(submissionId);
    if (!files || files.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron archivos para esta entrega." });
    }
    res.json(files);
  } catch (error) {
    console.error("Error al obtener archivos por entrega:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.updateScore = async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;

  if (score === undefined || isNaN(score)) {
    return res.status(400).json({ message: "Calificación inválida." });
  }

  try {
    const conn = await pool.getConnection();
    const [result] = await conn.query(
      `UPDATE Files SET Score = ? WHERE FileID = ?`,
      [score, id]
    );
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Archivo no encontrado." });
    }

    res.status(200).json({ message: "Calificación actualizada en archivo." });
  } catch (error) {
    console.error("Error al actualizar calificación:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

async function getCourseName(courseId) {
  // Aquí puedes implementar la lógica para obtener el nombre del curso desde la base de datos
  // Por ejemplo:
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

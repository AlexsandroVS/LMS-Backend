const File = require("../models/Files");
const fs = require("fs");
const pool = require("../config/db");
const path = require("path");
const libre = require('libreoffice-convert');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }

    const { activityId } = req.params;
    const conn = await pool.getConnection();

    try {
      // 1. Obtener CourseID y MaxAttempts
      const [activityData] = await conn.query(
        `SELECT m.CourseID, a.MaxAttempts
         FROM Activities a
         JOIN Modules m ON a.ModuleID = m.ModuleID
         WHERE a.ActivityID = ?`,
        [activityId]
      );

      if (!activityData.length) {
        return res.status(400).json({ message: 'Actividad no encontrada.' });
      }

      const courseId = activityData[0].CourseID;
      const maxAttempts = activityData[0].MaxAttempts || 1;

      // 2. Verificar cuántos archivos ha subido el usuario
      const [attempts] = await conn.query(
        `SELECT COUNT(*) AS total FROM Files WHERE UserID = ? AND ActivityID = ?`,
        [req.user.id, activityId]
      );

      if (attempts[0].total >= maxAttempts) {
        return res.status(403).json({
          message: `Has alcanzado el máximo de ${maxAttempts} intentos para esta actividad.`,
        });
      }

      // 3. Obtener ruta real del curso (subcarpeta en documents)
      const uploadDir = await getDocumentUploadPath(courseId);
      const { filename, mimetype } = req.file;
      let finalFilename = filename;
      let finalMimetype = mimetype;
      const originalPath = path.join(uploadDir, filename);

      // 4. Conversión si es Word/PPT
      if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
        mimetype === 'application/vnd.ms-powerpoint'
      ) {
        const outputPath = originalPath.replace(path.extname(originalPath), '.pdf');
        try {
          const fileBuffer = fs.readFileSync(originalPath);
          const pdfBuffer = await new Promise((resolve, reject) => {
            libre.convert(fileBuffer, '.pdf', undefined, (err, done) => {
              if (err) reject(err);
              else resolve(done);
            });
          });

          fs.writeFileSync(outputPath, pdfBuffer);
          fs.unlinkSync(originalPath); // eliminar original
          finalFilename = path.basename(outputPath);
          finalMimetype = 'application/pdf';
        } catch (error) {
          console.error('Error convirtiendo archivo:', error);
          return res.status(500).json({ message: 'Error al convertir archivo a PDF.' });
        }
      }

      // 5. Guardar archivo en base de datos con ruta completa
      const newFile = await File.create({
        ActivityID: activityId,
        UserID: req.user.id,
        CourseID: courseId,
        FileName: finalFilename,
        FileType: finalMimetype,
        Files: `documents/${path.basename(uploadDir)}/${finalFilename}`,
        UploadedAt: new Date(),
      });

      res.status(201).json(newFile);

    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ message: 'Error interno al subir archivo.' });
  }
};


async function getDocumentUploadPath(courseId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT Title FROM Courses WHERE CourseID = ?`, [courseId]
    );
    const courseName = rows.length > 0 ? rows[0].Title : "Curso";
    const subFolder = courseName.split(" ")[0].replace(/[^a-zA-Z0-9]/g, ""); // sanitizar
    const dirPath = path.join(__dirname, '..', '..', 'documents', subFolder);

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
      return res.status(404).json({ message: "Archivo no encontrado en el servidor" });
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
    const [file] = await conn.query("SELECT * FROM Files WHERE FileID = ?", [id]);
    if (file.length === 0) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    // Eliminar archivo de la base de datos
    const result = await conn.query("DELETE FROM Files WHERE FileID = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    // Eliminar el archivo físicamente si es necesario (opcional)
    const filePath = path.join(__dirname, '..', '..', file[0].Files);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);  // Elimina el archivo físicamente
    }

    res.status(200).json({ message: "Archivo eliminado correctamente" });

    conn.release();
  } catch (error) {
    console.error("Error al eliminar archivo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

exports.addFeedback = async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;

  try {
    if (!feedback || feedback.trim() === "") {
      return res.status(400).json({ message: "La retroalimentación no puede estar vacía." });
    }

    const success = await File.addFeedback(id, feedback);
    if (!success) {
      return res.status(404).json({ message: "Archivo no encontrado o no se pudo actualizar." });
    }

    res.status(200).json({ message: "Retroalimentación agregada correctamente." });
  } catch (error) {
    console.error("❌ Error al agregar feedback:", error);
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

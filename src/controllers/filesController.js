const File = require("../models/Files");
const fs = require("fs");
const pool = require("../config/db");
const path = require("path");

exports.uploadFile = async (req, res) => {
  const { activityId, courseId } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No se ha cargado ningún archivo." });
  }

  try {
    // Verifica que el archivo se esté recibiendo correctamente
    console.log("Archivo recibido:", file.originalname, file.size, file.mimetype);

    // Crear la ruta para guardar el archivo
    const courseName = await getCourseName(courseId); // Función que obtiene el nombre del curso
    const subFolder = courseName.split(" ")[0]; // Usamos la primera palabra del nombre del curso como subcarpeta
    const dirPath = path.join(__dirname, "..", "..", "documents", subFolder);

    // Verificamos si la carpeta existe, si no, la creamos
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Definir la ruta del archivo
    const filePath = path.join(dirPath, file.filename); // Usamos file.filename en lugar de file.originalname

    // Mover el archivo desde la ubicación temporal a la carpeta de destino
    fs.renameSync(file.path, filePath);

    // Guardamos solo la ruta relativa del archivo en la base de datos
    const relativeFilePath = path.join("documents", subFolder, file.filename);

    // Preparar los datos del archivo
    const fileData = {
      ActivityID: activityId,
      UserID: req.user.id,
      CourseID: courseId,
      FileName: file.originalname,
      FileType: file.mimetype,
      Files: relativeFilePath, // Guardamos la ruta relativa
      UploadedAt: new Date(),
    };

    // Insertamos la información del archivo en la base de datos
    const fileId = await File.create(fileData);
    
    res.status(201).json({ message: "Archivo cargado con éxito", fileId });
  } catch (error) {
    console.error("❌ Error al cargar archivo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
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

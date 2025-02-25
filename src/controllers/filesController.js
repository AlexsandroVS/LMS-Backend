  const File = require("../models/Files");

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
      const courseName = await getCourseName(courseId);  // Función que obtiene el nombre del curso, por ejemplo
      const subFolder = courseName.split(' ')[0]; // Usamos la primera palabra del nombre del curso como subcarpeta
      const dirPath = path.join(__dirname, '..', 'documents', subFolder);
  
      // Verificamos si la carpeta existe, si no, la creamos
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
  
      // Definir la ruta del archivo
      const filePath = path.join(dirPath, file.originalname);
  
      // Guardar el archivo en el sistema de archivos local
      fs.writeFileSync(filePath, file.buffer);
  
      // Guardamos solo la ruta del archivo en la base de datos
      const fileData = {
        ActivityID: activityId,
        UserID: req.user.id,
        FileName: file.originalname,
        FileType: file.mimetype,
        Files: filePath, // Guardamos la ruta del archivo
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
  
      // Configurar headers para la descarga
      res.setHeader("Content-Type", file.FileType);
      res.setHeader("Content-Disposition", `attachment; filename="${file.FileName}"`);
  
      // Enviar el archivo como un buffer
      res.send(file.Files);
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
        return res.status(404).json({ message: "No se encontraron archivos para esta actividad." });
      }

      res.json(files); // Retorna los archivos asociados a la actividad
    } catch (error) {
      console.error("❌ Error al obtener archivos:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
  // Eliminar archivo
  exports.deleteFile = async (req, res, next) => {
    try {
      const fileDeleted = await File.delete(req.params.id);
      if (!fileDeleted) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }
      res.json({ message: "Archivo eliminado correctamente" });
    } catch (error) {
      console.error("❌ Error al eliminar archivo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };
  async function getCourseName(courseId) {
    // Aquí puedes implementar la lógica para obtener el nombre del curso desde la base de datos
    // Por ejemplo:
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.query(`SELECT CourseName FROM Courses WHERE CourseID = ?`, [courseId]);
      return rows.length > 0 ? rows[0].CourseName : 'Curso Desconocido';
    } finally {
      conn.release();
    }
  }
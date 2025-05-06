const Activity = require("../models/Activity");
const File = require("../models/Files");
const multer = require("multer");
const storage = multer.memoryStorage();
const pool = require("../config/db");
const path = require("path");
const libre = require('libreoffice-convert');
const fs = require("fs");
const upload = multer({ storage: storage });

exports.getAllModuleActivities = async (req, res) => {
  const { moduleId } = req.params;

  try {
    const activities = await Activity.getAllByModuleId(moduleId);

    if (!activities || activities.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron actividades para este módulo." });
    }

    res.json(activities); // Devuelve todas las actividades
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
exports.getAllModuleActivities = async (req, res) => {
  const { moduleId } = req.params;

  try {
    const activities = await Activity.getAllByModuleId(moduleId);

    // Si no hay actividades, devolver una lista vacía
    if (!activities || activities.length === 0) {
      return res.status(200).json([]); // Devuelve una lista vacía con código 200
    }

    res.json(activities); // Devuelve todas las actividades
  } catch (error) {
    console.error("❌ Error al obtener actividades:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
exports.createActivity = async (req, res) => {
  const { moduleId, courseId } = req.params;
  const { title, content, type, deadline } = req.body;
  const file = req.file;

  try {
    if (!moduleId || !title || !content) {
      return res.status(400).json({ message: "Datos incompletos" });
    }
    if (!file) {
      return res.status(400).json({ message: "Se requiere un archivo válido" });
    }

    const activityData = {
      ModuleID: moduleId,
      Title: title,
      Content: content,
      Type: type,
      Deadline: deadline || null,
      MaxAttempts: req.body.maxAttempts || 1
    };
    

    const activityId = await Activity.create(activityData);
    console.log("Actividad creada con ID:", activityId);

    const courseName = await getCourseName(courseId);
    const subFolder = courseName.split(' ')[0];
    const dirPath = path.join('documents', subFolder);
    const inputPath = path.join(dirPath, file.filename);

    let finalFilename = file.filename;
    let finalMimetype = file.mimetype;

    // ➡ Aquí hacemos la conversión
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      file.mimetype === 'application/vnd.ms-powerpoint'
    ) {
      const outputPath = inputPath.replace(path.extname(inputPath), '.pdf');
      try {
        const fileBuffer = fs.readFileSync(inputPath);

        const pdfBuffer = await new Promise((resolve, reject) => {
          libre.convert(fileBuffer, '.pdf', undefined, (err, done) => {
            if (err) reject(err);
            else resolve(done);
          });
        });

        fs.writeFileSync(outputPath, pdfBuffer);
        fs.unlinkSync(inputPath); // Eliminamos el archivo original

        finalFilename = path.basename(outputPath);
        finalMimetype = 'application/pdf';
      } catch (error) {
        console.error('Error convirtiendo archivo a PDF:', error);
        return res.status(500).json({ message: 'Error al convertir el archivo.' });
      }
    }

    const relativeFilePath = path.join(dirPath, finalFilename);

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
    console.log("Archivo creado con ID:", fileId);

    res.status(201).json({
      message: "Actividad y archivo creados exitosamente",
      activity: { id: activityId, title },
      file: { name: file.originalname, type: finalMimetype }
    });

  } catch (error) {
    console.error("❌ Error en createActivity:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
exports.updateActivity = async (req, res) => {
  try {
    // Verificar si se proporcionan datos para actualizar
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }

    // Actualizar la actividad en la base de datos
    const result = await Activity.update(req.params.id, req.body);

    // Si no se actualizó ninguna fila, indicar que no se encontró la actividad
    if (!result) {
      return res.status(404).json({ message: "Actividad no encontrada." });
    }

    // Responder con éxito
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

      // Primero eliminar registros dependientes
      await conn.query('DELETE FROM activitygrades WHERE ActivityID = ?', [id]);
      await conn.query('DELETE FROM userprogress WHERE ActivityID = ?', [id]);
      await conn.query('DELETE FROM Files WHERE ActivityID = ?', [id]);
      await conn.query('DELETE FROM Activities WHERE ActivityID = ?', [id]);

      await conn.commit();
      res.json({ message: 'Actividad eliminada exitosamente' });

    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('❌ Error al eliminar actividad:', error);
    res.status(500).json({ message: 'Error al eliminar actividad' });
  }
};

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

async function getCourseIdFromModule(moduleId) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT CourseID FROM Modules WHERE ModuleID = ?`,
      [moduleId]
    );
    return rows.length > 0 ? rows[0].CourseID : null;
  } finally {
    conn.release();
  }
}



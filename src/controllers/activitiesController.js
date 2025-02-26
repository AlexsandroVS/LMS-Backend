const Activity = require("../models/Activity");
const File = require("../models/Files");
const multer = require("multer");
const storage = multer.memoryStorage();
const pool = require("../config/db");
const path = require("path");
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
    // Validar datos requeridos
    if (!moduleId || !title || !content) {
      return res.status(400).json({
        message: "Datos incompletos",
        required: {
          moduleId: !moduleId ? "falta" : "ok",
          title: !title ? "falta" : "ok",
          content: !content ? "falta" : "ok"
        }
      });
    }

    // Validar archivo
    if (!file) {
      return res.status(400).json({
        message: "Se requiere un archivo válido",
        received: "ningún archivo"
      });
    }

    // Crear actividad
    const activityData = {
      ModuleID: moduleId,
      Title: title,
      Content: content,
      Type: type,
      Deadline: deadline || null,
    };

    let activityId;
    try {
      activityId = await Activity.create(activityData);
      console.log("Actividad creada con ID:", activityId);
    } catch (error) {
      console.error("Error al crear actividad:", error);
      return res.status(500).json({
        message: "Error al crear la actividad",
        error: error.message
      });
    }

    // Obtener el nombre del curso y crear la subcarpeta
    const courseName = await getCourseName(courseId);
    const subFolder = courseName.split(' ')[0]; // Primera palabra del nombre del curso
    const dirPath = path.join('documents', subFolder); // Ruta relativa

    // Guardar solo la ruta relativa en la base de datos
    const relativeFilePath = path.join(dirPath, file.filename); // Ruta relativa al archivo

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

    try {
      const fileId = await File.create(fileData);
      console.log("Archivo creado con ID:", fileId);
    } catch (error) {
      console.error("Error al crear archivo:", error);
      return res.status(500).json({
        message: "Error al crear el archivo",
        error: error.message
      });
    }

    // Respuesta exitosa
    res.status(201).json({
      message: "Actividad y archivo creados exitosamente",
      activity: { id: activityId, title },
      file: { name: file.originalname, type: file.mimetype, size: file.size }
    });

  } catch (error) {
    console.error("❌ Error en el proceso:", error);
    res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
exports.updateActivity = async (req, res) => {
  const { id } = req.params;
  const { type, title, content, deadline } = req.body;
  try {
    const updatedActivityData = { type, title, content, deadline };
    const result = await Activity.update(id, updatedActivityData);
    if (!result) {
      return res.status(404).json({ message: "Actividad no encontrada." });
    }
    res.json({ message: "Actividad actualizada correctamente." });
  } catch (error) {
    console.error("❌ Error al actualizar actividad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

exports.deleteActivity = async (req, res) => {
  const { id } = req.params;

  try {
    // Paso 1: Eliminar los archivos asociados con esta actividad
    const files = await File.getByActivityId(id);
    if (files.length > 0) {
      // Si hay archivos, eliminamos todos
      for (const file of files) {
        const filePath = file.Files; // Ruta del archivo
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Eliminar el archivo físicamente
        }
        // Eliminar el archivo de la base de datos
        await File.delete(file.FileID);
        console.log(`Archivo con ID ${file.FileID} eliminado.`);
      }
    }

    // Paso 2: Eliminar la actividad
    const result = await Activity.delete(id);

    if (result) {
      return res.json({ message: "Actividad y archivos eliminados correctamente." });
    } else {
      // Si la actividad no fue eliminada, respondemos con un error de no encontrada
      return res.status(404).json({ message: "Actividad no encontrada." });
    }

  } catch (error) {
    console.error("❌ Error al eliminar actividad:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
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



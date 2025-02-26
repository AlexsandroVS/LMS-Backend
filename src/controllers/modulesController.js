// controllers/modulesController.js
const Module = require("../models/Module");

/**
 * 1) Listar módulos de un curso
 *    GET /courses/:courseId/modules
 */
exports.getCourseModules = async (req, res, next) => { 
  try {
    const modules = await Module.getByCourseId(req.params.courseId);

    // Asegúrate de mapear las columnas correctamente
    const mappedModules = modules.map((module) => ({
      ModuleID: module.ModuleID, // Asegúrate de que el nombre de la propiedad sea correcto
      title: module.Title, // Cambié 'title' por 'Title'
      moduleOrder: module.ModuleOrder, // Cambié 'moduleOrder' por 'ModuleOrder'
      CourseID: module.CourseID, // Cambié 'courseId' por 'CourseID'
      createdAt: module.CreatedAt, // Cambié 'createdAt' por 'CreatedAt'
    }));

    res.json(mappedModules);
  } catch (error) {
    console.error("❌ Error al obtener módulos:", error);
    res.status(500).json({ message: "Error al obtener módulos" });
  }
};


/**
 * 2) Crear un módulo en un curso
 *    POST /courses/:courseId/modules
 *    Body: { title: "Título", order: 2 }
 */
exports.createModule = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ error: "El ID del curso es requerido" });
    }

    if (!req.body.title) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    const moduleData = {
      courseId: courseId,
      title: req.body.title,
      moduleOrder: req.body.moduleOrder || 1,
    };

    const newModuleId = await Module.create(moduleData);

    res
      .status(201)
      .json({ id: Number(newModuleId), message: "Módulo creado exitosamente" }); // ✅ Convertir BigInt a Number
  } catch (error) {
    console.error("Error al crear módulo:", error);
    res.status(500).json({ error: "Error al crear módulo" });
  }
};

/**
 * 3) Obtener un módulo específico de un curso
 *    GET /courses/:courseId/modules/:moduleId
 */
exports.getModuleById = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.getById(moduleId);

    if (!module) {
      return res.status(404).json({ error: "Módulo no encontrado" });
    }
    // (Opcional) Verificar que module.CourseID == req.params.courseId
    // Si NO coincide, puedes responder 404 si deseas
    if (module.CourseID.toString() !== req.params.courseId) {
      return res
        .status(404)
        .json({ error: "Módulo no pertenece a este curso" });
    }

    res.json(module);
  } catch (error) {
    next(error);
  }
};

/**
 * 4) Actualizar un módulo de un curso
 *    PUT /courses/:courseId/modules/:moduleId
 *    Body: { title: "Nuevo título", order: 2 }
 */
exports.updateModule = async (req, res, next) => {
  try {
    await Module.update(req.params.moduleId, req.body);
    res.json({ message: "Módulo actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar módulo:", error);
    res.status(500).json({ error: "Error al actualizar módulo" });
  }
};

/**
 * 5) Eliminar un módulo de un curso
 *    DELETE /courses/:courseId/modules/:moduleId
 */
exports.deleteModule = async (req, res, next) => {
  try {
    await Module.delete(req.params.moduleId);
    res.json({ message: "Módulo eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar módulo:", error);
    res.status(500).json({ error: "Error al eliminar módulo" });
  }
};

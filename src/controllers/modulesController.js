// controllers/modulesController.js
const Module = require("../models/Module");

/**
 * 1) Listar módulos de un curso
 *    GET /courses/:courseId/modules
 */
// controllers/modulesController.js
exports.getCourseModules = async (req, res, next) => { 
  try {
    const isAdmin = req.user?.role === 'admin';
    const modules = await Module.getByCourseId(req.params.courseId, isAdmin); // Obtenemos los módulos con el filtro de bloqueo

    const mappedModules = modules.map((module) => ({
      ModuleID: module.ModuleID,
      title: module.Title,
      moduleOrder: module.ModuleOrder,
      isLocked: module.IsLocked,
      CourseID: module.CourseID,
      createdAt: module.CreatedAt,
    }));

    res.json(mappedModules);
  } catch (error) {
    console.error("❌ Error al obtener módulos:", error);
    res.status(500).json({ message: "Error al obtener módulos" });
  }
};

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
// controllers/modulesController.j
// controllers/modulesController.js
exports.getModuleById = async (req, res, next) => {
  try {
    const module = await Module.getById(req.params.moduleId, req.user?.role === 'admin');
    if (!module) return res.status(404).json({ error: 'Módulo no encontrado' });

    res.json({
      ModuleID: module.ModuleID,
      title: module.Title,
      moduleOrder: module.ModuleOrder,
      isLocked: module.IsLocked,
      CourseID: module.CourseID,
      createdAt: module.CreatedAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4) Actualizar un módulo de un curso
 *    PUT /courses/:courseId/modules/:moduleId
 *    Body: { title: "Nuevo título", order: 2 }
 */
// Controlador para actualizar módulo, puede actualizar tanto el estado de bloqueo como otros campos.
exports.updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { title, moduleOrder, isLocked } = req.body;

    let updatedModule;

    // Si solo se pasa isLocked, actualizamos únicamente ese campo
    if (typeof isLocked !== "undefined") {
      updatedModule = await Module.updateLock(moduleId, isLocked);
    } 
    // Si se pasan título o móduloOrder, actualizamos esos campos
    else if (title || moduleOrder) {
      updatedModule = await Module.update(moduleId, { title, moduleOrder });
    }

    res.json({ message: "Módulo actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar módulo:", error);
    res.status(500).json({ error: "Error al actualizar el módulo" });
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

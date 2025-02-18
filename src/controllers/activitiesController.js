const Activity = require("../models/Activity");
const bcrypt = require("bcrypt"); // Asegúrate de importar bcrypt

exports.getAllModuleActivities = async (req, res) => {
  const { moduleId } = req.params;
  console.log(
    `📌 Recibiendo solicitud para obtener actividades del módulo: ${moduleId}`
  );

  try {
    const activities = await Activity.getAllByModuleId(moduleId);
    console.log("📌 Actividades obtenidas:", activities);

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

exports.createActivity = async (req, res) => {
  const { moduleId } = req.params;
  const { type, title, content, deadline } = req.body;
  try {
    const activityData = {
      moduleId,
      type,
      title,
      content,
      deadline,
    };
    const newActivityId = await Activity.create(activityData);

    res.status(201).json({ id: Number(newActivityId) });
  } catch (error) {
    console.error("❌ Error al crear actividad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
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
    const deleted = await Activity.delete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Actividad no encontrada." });
    }
    res.json({ message: "Actividad eliminada correctamente." });
  } catch (error) {
    console.error("❌ Error al eliminar actividad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

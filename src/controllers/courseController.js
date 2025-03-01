const Course = require('../models/Course');

// Controlador getAllCourses
exports.getAllCourses = async (req, res, next) => {
  try {
    const dbCourses = await Course.getAll();

    // Verifica que dbCourses[0] contiene los datos
    const courses = dbCourses[0].map((c) => ({
      id: c.CourseID,
      title: c.Title,
      description: c.Description,
      icon: c.Icon,
      status: c.Status,
      durationHours: c.DurationHours,
      createdBy: c.CreatedBy,
      createdByName: c.CreatedByName,
      color: c.Color || "#48CAE4", // Se asegura de que siempre haya un color
    }));

    res.json(courses);
  } catch (error) {
    next(error);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.getById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Curso no encontrado' });

    // Mapeo del curso para devolver todos los datos
    const mappedCourse = {
      id: course.CourseID,
      title: course.Title,
      description: course.Description,
      icon: course.Icon,
      status: course.Status,
      durationHours: course.DurationHours,
      createdBy: course.CreatedBy,
      createdByName: course.CreatedByName,
      color: course.Color || "#48CAE4", // Si no tiene color, usamos un valor por defecto
      createdAt: course.CreatedAt, // Agregar fecha de creación si la necesitas
    };

    res.json(mappedCourse); // Devolver todo el objeto del curso mapeado
  } catch (error) {
    next(error);
  }
};


exports.createCourse = async (req, res, next) => {
  try {
    const courseId = await Course.create(req.body);

    // Convertir a número si es BigInt
    const numericId = typeof courseId === "bigint" ? Number(courseId) : courseId;

    res.status(201).json({ id: numericId, message: "Curso creado exitosamente" });
  } catch (error) {
    console.error("Error en createCourse:", error);
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }
    await Course.update(req.params.id, req.body);
    res.json({ message: 'Curso actualizado exitosamente' });
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    await Course.delete(req.params.id);
    res.json({ message: 'Curso eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};

const Course = require('../models/Course');

exports.getAllCourses = async (req, res, next) => {
  try {
    const courses = await Course.getAll();
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.getById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(course);
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const courseId = await Course.create(req.body);
    res.status(201).json({ id: courseId, message: 'Curso creado exitosamente' });
  } catch (error) {
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    // Validar campos recibidos
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
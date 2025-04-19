const Course = require('../models/Course');
const path = require("path");

exports.getAllCourses = async (req, res, next) => {
  try {
    const dbCourses = await Course.getAll();
    const courses = dbCourses[0].map((c) => ({
      id: c.CourseID,
      title: c.Title,
      description: c.Description,
      icon: c.Icon,
      status: c.Status,
      durationHours: c.DurationHours,
      createdBy: c.CreatedBy,
      createdByName: c.CreatedByName,
      color: c.Color || "#48CAE4",
      image: c.Image,
      category: c.Category,
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
    const mappedCourse = {
      id: course.CourseID,
      title: course.Title,
      description: course.Description,
      icon: course.Icon,
      status: course.Status,
      durationHours: course.DurationHours,
      createdBy: course.CreatedBy,
      createdByName: course.CreatedByName,
      color: course.Color || "#48CAE4",
      createdAt: course.CreatedAt,
      image: course.Image,
      category: course.Category,
    };
    res.json(mappedCourse);
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const data = JSON.parse(req.body.data || "{}");
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }
    const courseId = await Course.create(data);
    const numericId = typeof courseId === "bigint" ? Number(courseId) : courseId;
    res.status(201).json({ id: numericId, message: "Curso creado exitosamente" });
  } catch (error) {
    console.error("Error en createCourse:", error);
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const data = req.body.data ? JSON.parse(req.body.data) : req.body;
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }
    await Course.update(courseId, data);
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

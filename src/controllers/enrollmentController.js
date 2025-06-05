// controllers/enrollmentController.js
const Enrollment = require('../models/Enrollment');

exports.getAllEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.getAll();
    res.json(enrollments);
  } catch (error) {
    next(error);
  }
};

// controllers/enrollmentController.js
exports.getCoursesByStudent = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const courses = await Enrollment.getCoursesByStudent(studentId);
    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }

};
exports.getEnrollmentById = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.getById(req.params.id);
    res.json(enrollment);
  } catch (error) {
    next(error);
  }
};

exports.createEnrollment = async (req, res, next) => {
  try {
    const newId = await Enrollment.create(req.body);
    res.status(201).json({ id: newId, message: "Matrícula registrada" });
  } catch (error) {
    next(error);
  }
};

exports.updateEnrollment = async (req, res, next) => {
  try {
    await Enrollment.update(req.params.id, req.body);
    res.json({ message: "Matrícula actualizada" });
  } catch (error) {
    next(error);
  }
};

exports.deleteEnrollment = async (req, res, next) => {
  try {
    await Enrollment.delete(req.params.id);
    res.json({ message: "Matrícula eliminada" });
  } catch (error) {
    next(error);
  }
};

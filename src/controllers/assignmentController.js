// controllers/assignmentController.js
const Assignment = require('../models/Assignment');

exports.getAllAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.getAll();
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.getById(req.params.id);
    res.json(assignment);
  } catch (error) {
    next(error);
  }
};

exports.createAssignment = async (req, res, next) => {
  try {
    const newId = await Assignment.create(req.body);
    res.status(201).json({ id: newId, message: "Asignación creada" });
  } catch (error) {
    next(error);
  }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    await Assignment.update(req.params.id, req.body);
    res.json({ message: "Asignación actualizada" });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssignment = async (req, res, next) => {
  try {
    await Assignment.delete(req.params.id);
    res.json({ message: "Asignación eliminada" });
  } catch (error) {
    next(error);
  }
};

exports.getStudentsByTeacher = async (req, res) => {
  const { teacherId } = req.params;

  try {
    const students = await Assignment.getStudentsByTeacher(teacherId);

    const transformedStudents = students.map(student => ({
      StudentID: student.StudentID,
      StudentName: student.StudentName.trim(),
      StudentEmail: student.StudentEmail,
      StudentAvatar: student.StudentAvatar || '/img/default-avatar.png',
      StudentRole: student.StudentRole,
      RegistrationDate: student.StudentRegistrationDate,
      CourseID: student.CourseID,
      CourseTitle: student.CourseTitle
    }));

    res.json(transformedStudents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener estudiantes' });
  }
};
// En tu archivo de rutas (routes/statistics.js)
const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

router.get('/teacher/:id/courses', statisticsController.getCoursesByTeacher);

router.get('/courses', statisticsController.getCoursesForFilter);
router.get('/:courseId/module-averages', statisticsController.getModuleAveragesByCourse);
router.get('/:courseId/low-performance-students', statisticsController.getLowPerformanceStudentsByCourse);
router.get('/:courseId/top-performance-students', statisticsController.getTopPerformanceStudentsByCourse);
router.get('/:courseId/low-completion-activities', statisticsController.getLowCompletionActivitiesByCourse);

module.exports = router;
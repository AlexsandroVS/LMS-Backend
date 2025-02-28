// routes/modules.js
const express = require('express');
const router = express.Router();
const modulesController = require('../controllers/modulesController');
const auth = require('../middlewares/auth');

// Aplicar autenticación a todas las rutas
router.use(auth.protect);

router.get('/courses/:courseId/modules', modulesController.getCourseModules);
router.post('/courses/:courseId/modules', auth.restrictTo('admin'), modulesController.createModule);

router.get('/courses/:courseId/modules/:moduleId', modulesController.getModuleById);
router.put('/courses/:courseId/modules/:moduleId', auth.restrictTo('admin'), modulesController.updateModule);
router.delete('/courses/:courseId/modules/:moduleId', auth.restrictTo('admin'), modulesController.deleteModule);

module.exports = router;

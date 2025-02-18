// routes/modules.js
const express = require('express');
const router = express.Router();
const modulesController = require('../controllers/modulesController');

/**
 * Rutas como sub-recurso de "courses"
 * EJEMPLOS de endpoints:
 *  - GET /courses/1/modules         => Listar módulos del curso 1
 *  - POST /courses/1/modules        => Crear módulo en el curso 1
 *  - GET /courses/1/modules/5       => Obtener módulo 5 del curso 1
 *  - PUT /courses/1/modules/5       => Actualizar módulo 5 del curso 1
 *  - DELETE /courses/1/modules/5    => Eliminar módulo 5 del curso 1
 */
router.get('/courses/:courseId/modules', modulesController.getCourseModules);
router.post('/courses/:courseId/modules', modulesController.createModule);

// Opcional: traer un solo módulo, update y delete
router.get('/courses/:courseId/modules/:moduleId', modulesController.getModuleById);
router.put('/courses/:courseId/modules/:moduleId', modulesController.updateModule);
router.delete('/courses/:courseId/modules/:moduleId', modulesController.deleteModule);

module.exports = router;

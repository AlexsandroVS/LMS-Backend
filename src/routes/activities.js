const express = require('express');
const router = express.Router();
const activitiesController = require('../controllers/activitiesController');

// Obtener todas las actividades de un módulo
router.get('/courses/:courseId/modules/:moduleId/activities', activitiesController.getAllModuleActivities);

// Obtener una actividad por su ID
router.get('/activities/:id', activitiesController.getActivityById);

// Crear una actividad en un módulo
router.post('/courses/:courseId/modules/:moduleId/activities', activitiesController.createActivity);

// Actualizar una actividad
router.put('/activities/:id', activitiesController.updateActivity);

// Eliminar una actividad
router.delete('/activities/:id', activitiesController.deleteActivity);

module.exports = router;

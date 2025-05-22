const express = require("express");
const router = express.Router();
const submissionsController = require("../controllers/submissionsController");
const { protect } = require("../middlewares/auth");

// Crear una nueva entrega para una actividad
router.post(
  "/activities/:activityId/submissions",
  protect,
  submissionsController.createSubmission
);
router.get(
  "/averages/overall/:userId",
  protect,
  submissionsController.getUserOverallAverage
);

// Obtener todas las entregas de un usuario para una actividad
router.get(
  "/activities/:activityId/users/:userId/submissions",
  protect,
  submissionsController.getSubmissionsByActivityAndUser
);
router.get(
  "/activities/:activityId/submissions/all",
  protect,
  submissionsController.getAllSubmissionsWithFilesByActivity
);

// Obtener la entrega final de un usuario para una actividad
router.get(
  "/activities/:activityId/users/:userId/final-submission",
  protect,
  submissionsController.getFinalSubmission
);

router.get(
  "/averages/:courseId/:userId",
  protect,
  submissionsController.getUserCourseAverages
);

router.patch(
  "/submissions/:submissionId/feedback",
  protect,
  submissionsController.updateFeedback
);
// Marcar una entrega como final
router.put(
  "/submissions/:submissionId/final",
  protect,
  submissionsController.setFinalSubmission
);



module.exports = router;

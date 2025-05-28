const Submission = require("../models/Submission");
const Activity = require("../models/Activity"); // Necesario para obtener MaxSubmissions
const pool = require('../config/db'); 
// Crear una nueva entrega
exports.createSubmission = async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.id;

  try {
    const maxAllowed = await Activity.getMaxSubmissions(activityId);
    const attempts = await Submission.countAttempts(activityId, userId);

    if (attempts >= maxAllowed) {
      return res.status(400).json({ message: "Has alcanzado el número máximo de entregas" });
    }

    const submissionData = {
      ActivityID: activityId,
      UserID: userId,
      AttemptNumber: attempts + 1,
      SubmittedAt: new Date(),
    };

    const submissionId = await Submission.create(submissionData);

    res.status(201).json({
      message: "Entrega registrada correctamente",
      submissionId,
      attempt: submissionData.AttemptNumber,
    });
  } catch (error) {
    console.error("❌ Error al crear entrega:", error);
    res.status(500).json({ message: "Error al registrar entrega" });
  }
};

// Obtener todas las entregas de un estudiante para una actividad
exports.getSubmissionsByActivityAndUser = async (req, res) => {
  const { activityId, userId } = req.params;
  try {
    const submissions = await Submission.getByActivityAndUser(activityId, userId);
    res.json(submissions);
  } catch (error) {
    console.error("❌ Error al obtener entregas:", error);
    res.status(500).json({ message: "Error al obtener entregas" });
  }
};

// Obtener la entrega final (la válida)
exports.getFinalSubmission = async (req, res) => {
  const { activityId, userId } = req.params;
  try {
    const final = await Submission.getFinalSubmission(activityId, userId);
    res.json(final);
  } catch (error) {
    console.error("❌ Error al obtener entrega final:", error);
    res.status(500).json({ message: "Error al obtener entrega final" });
  }
};

// Marcar una entrega como final
exports.setFinalSubmission = async (req, res) => {
  const { submissionId } = req.params;
  const { activityId, userId } = req.body;

  try {
    await Submission.markAsFinal(submissionId, activityId, userId);
    res.json({ message: "Entrega marcada como final" });
  } catch (error) {
    console.error("❌ Error al marcar como final:", error);
    res.status(500).json({ message: "Error al actualizar entrega final" });
  }
};

exports.getAllSubmissionsWithFilesByActivity = async (req, res) => {
  const { activityId } = req.params;
  try {
    const submissions = await Submission.getAllWithFilesByActivity(activityId);
    res.json(submissions);
  } catch (error) {
    console.error("❌ Error al obtener todas las entregas:", error);
    res.status(500).json({ message: "Error al obtener entregas con archivos" });
  }
};
exports.updateFeedback = async (req, res) => {
  const { submissionId } = req.params;
  const { feedback } = req.body;

  if (typeof feedback !== "string") {
    return res.status(400).json({ message: "El feedback debe ser texto." });
  }

  try {
    const updated = await Submission.updateFeedback(submissionId, feedback);
    if (!updated) {
      return res.status(404).json({ message: "Entrega no encontrada." });
    }

    res.json({ message: "Feedback actualizado correctamente." });
  } catch (error) {
    console.error("❌ Error al actualizar feedback:", error);
    res.status(500).json({ message: "Error al actualizar feedback." });
  }
};
exports.getUserCourseAverages = async (req, res) => {
  const { courseId, userId } = req.params;
  try {
    const result = await Submission.getUserAverageByCourse(courseId, userId);
    res.json(result);
  } catch (error) {
    console.error("❌ Error al calcular promedios:", error);
    res.status(500).json({ message: "Error al calcular promedios." });
  }
};
exports.getUserOverallAverage = async (req, res) => {
  const { userId } = req.params;


  try {
    const result = await Submission.getOverallAverageByUser(userId); 
    res.json(result);
  } catch (error) {
    console.error("❌ Error al calcular promedio general:", error);
    res.status(500).json({ message: "Error al calcular promedio general." });
  }
};

exports.updateScore = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score } = req.body;

    if (typeof score !== "number") {
      return res.status(400).json({ message: "Score inválido" });
    }

    // Aquí tu lógica para actualizar el score en DB
    const [result] = await pool.query(
      `UPDATE Submissions SET Score = ?, GradedAt = NOW() WHERE SubmissionID = ?`,
      [score, submissionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Entrega no encontrada" });
    }

    res.status(200).json({ message: "Score actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar score:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

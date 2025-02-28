const UserProgress = require("../models/UserProgress");
const ProgressSummary = require("../models/ProgressSummary");

exports.getFullProgress = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    
    const detailedProgress = await UserProgress.findByUserAndCourse(userId, courseId);
    const summary = await ProgressSummary.getByUserCourse(userId, courseId);
    
    res.json({
      success: true,
      data: {
        summary,
        details: detailedProgress
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getCourseSummary = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const summary = await ProgressSummary.getByUserCourse(userId, courseId);
    
    const courseSummary = summary.find(s => s.ModuleID === null);
    const moduleSummaries = summary.filter(s => s.ModuleID !== null);
    
    res.json({
      success: true,
      data: {
        course: courseSummary,
        modules: moduleSummaries
      }
    });
  } catch (error) {
    next(error);
  }
};
exports.createOrUpdateProgress = async (req, res, next) => {
  try {
    const { userId, courseId, moduleId, activityId } = req.params;
    const { status, score } = req.body;
    
    // Verificar si ya existe el progreso
    const existingProgress = await UserProgress.findByUserAndCourse(userId, courseId);
    
    let result;
    if (existingProgress.length > 0) {
      result = await UserProgress.update(existingProgress[0].ProgressID, {
        status,
        score
      });
    } else {
      result = await UserProgress.create({
        userId,
        courseId,
        moduleId,
        activityId,
        status,
        score
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserProgress = async (req, res, next) => {
  try {
    const { userId, courseId } = req.params;
    const progress = await UserProgress.findByUserAndCourse(userId, courseId);
    
    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

exports.listEnrollments = async (req, res, next) => {
  try {
    const enrollments = await UserProgress.getEnrollments();
    
    res.status(200).json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    next(error);
  }
};
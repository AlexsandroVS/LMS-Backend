const Course = require('../models/Course');
const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

// 🔄 Utilidad para mapear cursos
const mapCourse = (c) => ({
  id: c.CourseID,
  title: c.Title,
  description: c.Description,
  icon: c.Icon,
  status: c.Status,
  createdBy: c.CreatedBy,
  createdByName: c.CreatedByName,
  color: c.Color || "#48CAE4",
  image: c.Image,
  category: c.Category,
  createdAt: c.CreatedAt || null,
});

/* --------------------- Obtener todos o buscar --------------------- */
exports.getAllCourses = async (req, res, next) => {
  try {
    const searchQuery = req.query.search;
    const dbCourses = searchQuery
      ? await Course.search(searchQuery)
      : await Course.getAll();

    const courses = dbCourses[0].map(mapCourse);
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

/* --------------------- Obtener uno por ID --------------------- */
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.getById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(mapCourse(course));
  } catch (error) {
    next(error);
  }
};

/* --------------------- Crear curso --------------------- */
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

/* --------------------- Actualizar curso --------------------- */
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

/* --------------------- Eliminar curso --------------------- */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const [results] = await pool.query("SELECT Image FROM Courses WHERE CourseID = ?", [id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    const imagePath = results[0].Image;

    // Eliminar archivo físico si existe
    if (imagePath) {
      const fullPath = path.join(__dirname, "..", "..", "uploads", path.basename(imagePath));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log("✅ Imagen del curso eliminada:", fullPath);
      }
    }

    await pool.query("DELETE FROM Courses WHERE CourseID = ?", [id]);

    res.json({ message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar curso:", error);
    res.status(500).json({ error: "Error al eliminar el curso" });
  }
};

// Función auxiliar para eliminar archivos de actividades
async function deleteActivityFiles(conn, activityId) {
  const [files] = await conn.query(
    "SELECT FilePath FROM Files WHERE ActivityID = ?", 
    [activityId]
  );
  
  files.forEach(file => {
    if (file.FilePath && fs.existsSync(file.FilePath)) {
      fs.unlinkSync(file.FilePath);
    }
  });
  
  await conn.query("DELETE FROM Files WHERE ActivityID = ?", [activityId]);
}

/* --------------------- Sugerencias de búsqueda --------------------- */
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { query } = req.query;
    const likeQuery = `%${query}%`;

    const [courses] = await pool.query(`
      SELECT 
        CourseID as id, 
        Title as title, 
        Image as image, 
        Category as category,
        'course' as type
      FROM Courses
      WHERE Title LIKE ? OR Description LIKE ? OR Category LIKE ?
      ORDER BY Title
      LIMIT 5
    `, [likeQuery, likeQuery, likeQuery]);

    const suggestedTerms = [
      { type: 'term', value: `${query} básico` },
      { type: 'term', value: `${query} avanzado` },
      { type: 'term', value: `Introducción a ${query}` },
      { type: 'term', value: `Curso completo de ${query}` }
    ];

    res.json([...courses, ...suggestedTerms]);
  } catch (error) {
    next(error);
  }
};

/* --------------------- Búsquedas relacionadas --------------------- */
exports.getRelatedSearches = async (req, res, next) => {
  try {
    const { query } = req.query;
    const related = [
      `${query} para principiantes`,
      `Curso completo de ${query}`,
      `Aprender ${query} rápido`,
    ];
    res.json(related);
  } catch (error) {
    next(error);
  }
};

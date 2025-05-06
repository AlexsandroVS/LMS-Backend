const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// Habilitar CORS
app.use(cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE, PATCH",
    allowedHeaders: "Content-Type,Authorization"
}));

// Middleware para parsear JSON
app.use(express.json());

// Configurar carpeta estática para servir imágenes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configurar Multer para guardar archivos en "uploads"
const storage = multer.diskStorage({ /* ... */ });
const upload = multer({ storage });
const statisticsRoutes = require('./routes/statisticsRoutes');

app.use('/api/stats', statisticsRoutes);
// Rutas
app.use("/api/users", require("./routes/users"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/modules"));
app.use("/api", require("./routes/activities"));
app.use("/api/grades", require("./routes/grade"));
app.use("/api", require("./routes/filesRoutes"));
app.use("/api/progress", require("./routes/progress"));
app.use("/documents", express.static(path.join(__dirname, "..", "documents")));

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
app.use("/uploads", express.static("uploads"));

module.exports = { app, upload };
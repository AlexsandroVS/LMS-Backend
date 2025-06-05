const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const { protect } = require("./middlewares/auth");

const app = express();

// Habilitar CORS
app.use(
  cors({
    origin: ["http://localhost:5173",'http://localhost:3000', "http://192.168.13.30:5173",'http://frontend:4173'],

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());

// Middleware para parsear JSON
app.use(express.json());

// Configurar carpeta estática para servir imágenes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/documents", express.static(path.join(__dirname, "..", "documents")));
// Configurar Multer para guardar archivos en "uploads"
const storage = multer.diskStorage({
  /* ... */
});
const upload = multer({ storage });
const statisticsRoutes = require("./routes/statisticsRoutes");

// Rutas públicas de autenticación
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/filesRoutes"));
// Middleware global de protección
app.use(protect);

// Rutas protegidas (todo lo demás)
app.use("/api/users", require("./routes/users"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api", require("./routes/modules"));
app.use("/api/assignments", require("./routes/assignments"));
app.use("/api/enrollments", require("./routes/enrollments"));
app.use("/api", require("./routes/activities"));

app.use("/api", require("./routes/submisions"));
app.use("/api/stats", require("./routes/statisticsRoutes"));

// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
);
app.use("/uploads", express.static("uploads"));

module.exports = { app, upload };

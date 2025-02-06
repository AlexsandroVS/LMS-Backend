const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// Habilitar CORS
app.use(cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization"
}));

// Middleware para parsear JSON
app.use(express.json());

// Configurar carpeta estática para servir imágenes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configurar Multer para guardar archivos en la carpeta "uploads"
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Carpeta donde se guardan las imágenes
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre único para cada imagen
    }
  });

const upload = multer({ storage });

// Rutas
app.use("/api/users", require("./routes/users"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/auth", require("./routes/auth"));

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
app.use("/uploads", express.static("uploads"));

module.exports = { app, upload }; // Exportar `upload` para usar en los controladores

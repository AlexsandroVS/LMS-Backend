const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const path = require("path");
const { protect } = require("./middlewares/auth");

const app = express();

// Habilitar CORS
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173", "http://localhost", "http://frontend:4173"];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como curl o Postman)
    if (!origin) return callback(null, true);
    if (corsOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200 // Para legacy browsers
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight universal

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

// Health check (pública)
app.use("/api", require("./routes/health"));

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
  // Asegurar headers de CORS en errores
  res.header("Access-Control-Allow-Origin", req.headers.origin || corsOrigins[0]);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");

  // Si la petición es OPTIONS, responder 204
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Error interno del servidor" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
);
app.use("/uploads", express.static("uploads"));

module.exports = { app, upload };

const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads')); // Ruta absoluta
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`); // Mismo formato que en el controlador
  }
});

// 📌 Middleware de Multer para aceptar archivos
const upload = multer({ storage });

// 📌 Todas las rutas están protegidas
router.use(protect);

// 📌 Rutas protegidas solo para administradores
router.get("/",  getAllUsers);
router.post("/", restrictTo("admin"), upload.single("avatar"), createUser);
router.delete("/:id", restrictTo("admin"), deleteUser);

// 📌 Rutas accesibles por usuarios autenticados
router.get("/:id", getUserById);
router.put("/:id", upload.single("avatar"), updateUser);

module.exports = router;

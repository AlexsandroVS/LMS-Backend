const express = require('express');
const router = express.Router();
const { login, register, getMe, logout } = require('../controllers/authController');
const { protect, restrictTo } = require('../middlewares/auth'); 

// Público
router.post('/login', login);

// Solo admin puede registrar
router.post('/register', protect, restrictTo('admin'), register);

// Requiere login
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;

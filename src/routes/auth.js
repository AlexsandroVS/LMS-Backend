// src/routes/auth.js
const express = require('express');
const router = express.Router();
const { login, register, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/auth'); 

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;

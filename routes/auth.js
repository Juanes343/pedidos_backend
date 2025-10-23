const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Rutas de autenticación
router.post('/registro', authController.registro);
router.post('/login', authController.login);

// Ruta de prueba
router.get('/test', authController.test);

module.exports = router;
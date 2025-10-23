const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Ruta para registro de usuarios
router.post('/', authController.registro);

module.exports = router;
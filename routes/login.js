const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// Ruta para login de usuarios
router.post('/', authController.login);

module.exports = router;
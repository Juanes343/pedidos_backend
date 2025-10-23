const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Rutas para gestión de órdenes (administrador)
router.get('/', orderController.obtenerOrdenes);
router.get('/estadisticas', orderController.obtenerEstadisticasVentas);
router.get('/usuario/:usuarioId', orderController.obtenerOrdenesPorUsuario);
router.get('/:id', orderController.obtenerOrdenPorId);
router.post('/', orderController.crearOrden);
router.patch('/:id/estado', orderController.actualizarEstadoOrden);

module.exports = router;
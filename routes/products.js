const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// Rutas para gestión de productos (administrador)
router.get('/', productController.obtenerProductos);
router.get('/categorias', productController.obtenerCategorias);
router.get('/categories', productController.obtenerCategorias); // Ruta en inglés para compatibilidad
router.get('/:id', productController.obtenerProductoPorId);
router.post('/', productController.crearProducto);
router.put('/:id', productController.actualizarProducto);
router.delete('/:id', productController.eliminarProducto);
router.patch('/:id/toggle-activo', productController.toggleActivoProducto);
router.patch('/:id/stock', productController.actualizarStock);

module.exports = router;
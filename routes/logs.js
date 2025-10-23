const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const router = express.Router();

// Ruta para obtener logs/información del sistema
router.get('/', async (req, res) => {
  try {
    // Obtener estadísticas básicas
    const totalUsuarios = await User.countDocuments();
    const totalProductos = await Product.countDocuments();
    const totalOrdenes = await Order.countDocuments();
    const productosActivos = await Product.countDocuments({ activo: true });
    const ordenesHoy = await Order.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    res.json({
      success: true,
      message: 'Logs del sistema obtenidos exitosamente',
      data: {
        timestamp: new Date().toISOString(),
        estadisticas: {
          usuarios: totalUsuarios,
          productos: totalProductos,
          productosActivos,
          ordenes: totalOrdenes,
          ordenesHoy
        },
        sistema: {
          version: '1.0.0',
          estado: 'funcionando',
          baseDatos: 'conectada'
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
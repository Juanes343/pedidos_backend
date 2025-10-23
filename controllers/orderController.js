const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const orderController = {
  // Obtener todas las órdenes (para administrador)
  obtenerOrdenes: async (req, res) => {
    try {
      const { estado, usuario, fechaInicio, fechaFin, page = 1, limit = 10 } = req.query;
      
      // Construir filtros
      const filtros = {};
      if (estado) filtros.estado = estado;
      if (usuario) filtros.usuario = usuario;
      
      // Filtro por rango de fechas
      if (fechaInicio || fechaFin) {
        filtros.createdAt = {};
        if (fechaInicio) filtros.createdAt.$gte = new Date(fechaInicio);
        if (fechaFin) filtros.createdAt.$lte = new Date(fechaFin);
      }

      // Calcular paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Obtener órdenes con información del usuario
      const ordenes = await Order.find(filtros)
        .populate('usuario', 'nombre email')
        .populate('items.producto', 'nombre categoria')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Contar total de órdenes
      const total = await Order.countDocuments(filtros);

      res.json({
        success: true,
        data: ordenes,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error al obtener órdenes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener una orden por ID
  obtenerOrdenPorId: async (req, res) => {
    try {
      const { id } = req.params;
      
      const orden = await Order.findById(id)
        .populate('usuario', 'nombre email telefono')
        .populate('items.producto', 'nombre categoria imagen');

      if (!orden) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      res.json({
        success: true,
        data: orden
      });

    } catch (error) {
      console.error('Error al obtener orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nueva orden
  crearOrden: async (req, res) => {
    try {
      const { usuario, items, metodoPago, direccionEntrega, telefono, notas } = req.body;

      // Validar datos requeridos
      if (!usuario || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Usuario e items son obligatorios'
        });
      }

      // Verificar que el usuario existe
      const usuarioExiste = await User.findById(usuario);
      if (!usuarioExiste) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Validar y procesar items
      const itemsProcesados = [];
      let totalCalculado = 0;

      for (const item of items) {
        const producto = await Product.findById(item.producto);
        if (!producto) {
          return res.status(404).json({
            success: false,
            message: `Producto ${item.producto} no encontrado`
          });
        }

        if (!producto.activo) {
          return res.status(400).json({
            success: false,
            message: `El producto ${producto.nombre} no está disponible`
          });
        }

        if (producto.stock < item.cantidad) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}`
          });
        }

        const subtotal = producto.precio * item.cantidad;
        totalCalculado += subtotal;

        itemsProcesados.push({
          producto: producto._id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: item.cantidad,
          subtotal: subtotal
        });

        // Reducir stock
        producto.stock -= item.cantidad;
        await producto.save();
      }

      // Crear la orden
      const nuevaOrden = new Order({
        usuario,
        items: itemsProcesados,
        total: totalCalculado,
        metodoPago,
        direccionEntrega,
        telefono,
        notas
      });

      await nuevaOrden.save();

      // Poblar la orden antes de enviarla
      await nuevaOrden.populate('usuario', 'nombre email');
      await nuevaOrden.populate('items.producto', 'nombre categoria');

      res.status(201).json({
        success: true,
        message: 'Orden creada exitosamente',
        data: nuevaOrden
      });

    } catch (error) {
      console.error('Error al crear orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar estado de orden
  actualizarEstadoOrden: async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El estado es obligatorio'
        });
      }

      const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'];
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado no válido'
        });
      }

      const orden = await Order.findById(id);
      if (!orden) {
        return res.status(404).json({
          success: false,
          message: 'Orden no encontrada'
        });
      }

      // Si se cancela la orden, restaurar el stock
      if (estado === 'cancelado' && orden.estado !== 'cancelado') {
        for (const item of orden.items) {
          const producto = await Product.findById(item.producto);
          if (producto) {
            producto.stock += item.cantidad;
            await producto.save();
          }
        }
      }

      orden.estado = estado;
      await orden.save();

      await orden.populate('usuario', 'nombre email');
      await orden.populate('items.producto', 'nombre categoria');

      res.json({
        success: true,
        message: 'Estado de orden actualizado exitosamente',
        data: orden
      });

    } catch (error) {
      console.error('Error al actualizar estado de orden:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener estadísticas de ventas
  obtenerEstadisticasVentas: async (req, res) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      
      // Construir filtro de fechas
      const filtroFecha = {};
      if (fechaInicio || fechaFin) {
        filtroFecha.createdAt = {};
        if (fechaInicio) filtroFecha.createdAt.$gte = new Date(fechaInicio);
        if (fechaFin) filtroFecha.createdAt.$lte = new Date(fechaFin);
      }

      // Estadísticas generales
      const totalOrdenes = await Order.countDocuments(filtroFecha);
      const ordenesEntregadas = await Order.countDocuments({ 
        ...filtroFecha, 
        estado: 'entregado' 
      });
      const ordenesCanceladas = await Order.countDocuments({ 
        ...filtroFecha, 
        estado: 'cancelado' 
      });

      // Ingresos totales (solo órdenes entregadas)
      const ingresosTotales = await Order.aggregate([
        { 
          $match: { 
            ...filtroFecha, 
            estado: 'entregado' 
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$total' } 
          } 
        }
      ]);

      // Ventas por día
      const ventasPorDia = await Order.aggregate([
        { 
          $match: { 
            ...filtroFecha, 
            estado: 'entregado' 
          } 
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            ventas: { $sum: 1 },
            ingresos: { $sum: '$total' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Productos más vendidos
      const productosMasVendidos = await Order.aggregate([
        { 
          $match: { 
            ...filtroFecha, 
            estado: 'entregado' 
          } 
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.producto',
            nombre: { $first: '$items.nombre' },
            cantidadVendida: { $sum: '$items.cantidad' },
            ingresos: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { cantidadVendida: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        data: {
          resumen: {
            totalOrdenes,
            ordenesEntregadas,
            ordenesCanceladas,
            ingresosTotales: ingresosTotales[0]?.total || 0,
            tasaExito: totalOrdenes > 0 ? ((ordenesEntregadas / totalOrdenes) * 100).toFixed(2) : 0
          },
          ventasPorDia,
          productosMasVendidos
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener órdenes por usuario
  obtenerOrdenesPorUsuario: async (req, res) => {
    try {
      const { usuarioId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      // Verificar que el usuario existe
      const usuario = await User.findById(usuarioId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const ordenes = await Order.find({ usuario: usuarioId })
        .populate('items.producto', 'nombre categoria')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Order.countDocuments({ usuario: usuarioId });

      res.json({
        success: true,
        data: ordenes,
        usuario: {
          id: usuario._id,
          nombre: usuario.nombre,
          email: usuario.email
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error al obtener órdenes por usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = orderController;
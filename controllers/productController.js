const Product = require('../models/Product');

const productController = {
  // Obtener todos los productos (con filtros opcionales)
  obtenerProductos: async (req, res) => {
    try {
      const { categoria, activo, buscar, page = 1, limit = 50 } = req.query;
      
      console.log('Parámetros recibidos:', { categoria, activo, buscar, page, limit });
      
      // Construir filtros
      const filtros = {};
      if (categoria) filtros.categoria = categoria;
      if (activo !== undefined && activo !== '') {
        filtros.activo = activo === 'true';
      }
      if (buscar) {
        filtros.$or = [
          { nombre: { $regex: buscar, $options: 'i' } },
          { descripcion: { $regex: buscar, $options: 'i' } }
        ];
      }

      console.log('Filtros aplicados:', filtros);

      // Calcular paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Obtener productos con paginación
      const productos = await Product.find(filtros)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Contar total de productos
      const total = await Product.countDocuments(filtros);

      console.log(`Encontrados ${productos.length} productos de ${total} total`);

      res.json({
        success: true,
        data: productos,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener un producto por ID
  obtenerProductoPorId: async (req, res) => {
    try {
      const { id } = req.params;
      
      const producto = await Product.findById(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        data: producto
      });

    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Crear nuevo producto
  crearProducto: async (req, res) => {
    try {
      console.log('Datos recibidos para crear producto:', req.body);
      const { nombre, descripcion, precio, stock, imagen, categoria } = req.body;

      // Validar datos requeridos (stock e imagen son opcionales)
      console.log('Validando campos...');
      console.log('nombre:', JSON.stringify(nombre));
      console.log('descripcion:', JSON.stringify(descripcion));
      console.log('precio:', JSON.stringify(precio));
      console.log('categoria:', JSON.stringify(categoria));

      if (!nombre || nombre.trim() === '' || !descripcion || descripcion.trim() === '' || !precio || precio <= 0 || !categoria || categoria.trim() === '') {
        console.log('Validación fallida');
        return res.status(400).json({
          success: false,
          message: 'Los campos nombre, descripción, precio y categoría son obligatorios'
        });
      }

      console.log('Validación exitosa, continuando...');

      // Verificar si ya existe un producto con el mismo nombre
      const productoExistente = await Product.findOne({ 
        nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
      });
      
      if (productoExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un producto con ese nombre'
        });
      }

      const nuevoProducto = new Product({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio),
        stock: parseInt(stock) || 0,
        imagen: imagen ? imagen.trim() : '',
        categoria: categoria.trim()
      });

      await nuevoProducto.save();

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: nuevoProducto
      });

    } catch (error) {
      console.error('Error al crear producto:', error);
      
      if (error.name === 'ValidationError') {
        const errores = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: errores
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar producto
  actualizarProducto: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, precio, stock, imagen, categoria, activo } = req.body;

      const producto = await Product.findById(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar si el nuevo nombre ya existe en otro producto
      if (nombre && nombre !== producto.nombre) {
        const productoExistente = await Product.findOne({ 
          nombre: { $regex: new RegExp(`^${nombre}$`, 'i') },
          _id: { $ne: id }
        });
        
        if (productoExistente) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro producto con ese nombre'
          });
        }
      }

      // Actualizar campos
      if (nombre) producto.nombre = nombre;
      if (descripcion) producto.descripcion = descripcion;
      if (precio !== undefined) producto.precio = parseFloat(precio);
      if (stock !== undefined) producto.stock = parseInt(stock);
      if (imagen) producto.imagen = imagen;
      if (categoria) producto.categoria = categoria;
      if (activo !== undefined) producto.activo = activo;

      await producto.save();

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: producto
      });

    } catch (error) {
      console.error('Error al actualizar producto:', error);
      
      if (error.name === 'ValidationError') {
        const errores = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: errores
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar producto
  eliminarProducto: async (req, res) => {
    try {
      const { id } = req.params;

      const producto = await Product.findById(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      await Product.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Producto eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Activar/Desactivar producto
  toggleActivoProducto: async (req, res) => {
    try {
      const { id } = req.params;

      const producto = await Product.findById(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      producto.activo = !producto.activo;
      await producto.save();

      res.json({
        success: true,
        message: `Producto ${producto.activo ? 'activado' : 'desactivado'} exitosamente`,
        data: producto
      });

    } catch (error) {
      console.error('Error al cambiar estado del producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar stock
  actualizarStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { cantidad, operacion } = req.body; // operacion: 'sumar' o 'restar'

      if (!cantidad || !operacion) {
        return res.status(400).json({
          success: false,
          message: 'Cantidad y operación son obligatorios'
        });
      }

      const producto = await Product.findById(id);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const cantidadNum = parseInt(cantidad);
      if (operacion === 'sumar') {
        producto.stock += cantidadNum;
      } else if (operacion === 'restar') {
        if (producto.stock < cantidadNum) {
          return res.status(400).json({
            success: false,
            message: 'No hay suficiente stock disponible'
          });
        }
        producto.stock -= cantidadNum;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Operación no válida. Use "sumar" o "restar"'
        });
      }

      await producto.save();

      res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: producto
      });

    } catch (error) {
      console.error('Error al actualizar stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener categorías disponibles
  obtenerCategorias: async (req, res) => {
    try {
      const categorias = ['Hamburguesas', 'Bebidas', 'Acompañamientos', 'Pollo', 'Postres', 'Ensaladas'];
      
      res.json({
        success: true,
        data: categorias
      });

    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = productController;
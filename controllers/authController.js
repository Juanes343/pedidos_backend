const User = require('../models/User');

const authController = {
  // Registro de usuarios
  registro: async (req, res) => {
    try {
      const { nombre, email, password } = req.body;

      // Validar datos requeridos
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son obligatorios'
        });
      }

      // Verificar si el usuario ya existe
      const usuarioExistente = await User.findOne({ email: email.toLowerCase() });
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Crear nuevo usuario
      const nuevoUsuario = new User({
        nombre,
        email: email.toLowerCase(),
        password
      });

      await nuevoUsuario.save();

      // Respuesta sin incluir la contraseña
      const usuarioRespuesta = {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        createdAt: nuevoUsuario.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: usuarioRespuesta
      });

    } catch (error) {
      console.error('Error en registro:', error);
      
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

  // Login de usuarios
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validar datos requeridos
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son obligatorios'
        });
      }

      // Buscar usuario por email
      const usuario = await User.findOne({ email: email.toLowerCase() });
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const passwordValida = await usuario.compararPassword(password);
      if (!passwordValida) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Respuesta exitosa sin incluir la contraseña
      const usuarioRespuesta = {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        createdAt: usuario.createdAt
      };

      res.json({
        success: true,
        message: 'Login exitoso',
        user: usuarioRespuesta
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Ruta de prueba
  test: async (req, res) => {
    res.json({
      success: true,
      message: 'Controlador de autenticación funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = authController;
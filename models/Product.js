const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  imagen: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    trim: true,
    enum: {
      values: ['Hamburguesas', 'Bebidas', 'Acompañamientos', 'Pollo', 'Postres', 'Ensaladas', 'Electronica', 'Otros'],
      message: 'Categoría no válida'
    }
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para mejorar las consultas
productSchema.index({ categoria: 1 });
productSchema.index({ activo: 1 });
productSchema.index({ nombre: 'text', descripcion: 'text' });

module.exports = mongoose.model('Product', productSchema);
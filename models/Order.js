const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es obligatorio']
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: [true, 'El total es obligatorio'],
    min: [0, 'El total no puede ser negativo']
  },
  estado: {
    type: String,
    required: true,
    enum: {
      values: ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'],
      message: 'Estado no válido'
    },
    default: 'pendiente'
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia'],
    default: 'efectivo'
  },
  direccionEntrega: {
    type: String,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  notas: {
    type: String,
    trim: true,
    maxlength: [200, 'Las notas no pueden exceder 200 caracteres']
  }
}, {
  timestamps: true
});

// Índices para mejorar las consultas
orderSchema.index({ usuario: 1 });
orderSchema.index({ estado: 1 });
orderSchema.index({ createdAt: -1 });

// Método para calcular el total
orderSchema.methods.calcularTotal = function() {
  this.total = this.items.reduce((total, item) => total + item.subtotal, 0);
  return this.total;
};

// Pre-save middleware para calcular subtotales
orderSchema.pre('save', function(next) {
  this.items.forEach(item => {
    item.subtotal = item.precio * item.cantidad;
  });
  this.calcularTotal();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
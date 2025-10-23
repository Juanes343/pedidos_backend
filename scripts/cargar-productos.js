const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Importar el modelo de Producto
const Product = require('../models/Product');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conexión a MongoDB establecida'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Leer el archivo JSON de productos
const productosPath = path.join(__dirname, '../data/productos.json');
const productos = JSON.parse(fs.readFileSync(productosPath, 'utf8'));

// Función para cargar los productos
async function cargarProductos() {
  try {
    // Eliminar productos existentes (opcional)
    await Product.deleteMany({});
    console.log('Productos existentes eliminados');

    // Insertar los nuevos productos
    const result = await Product.insertMany(productos);
    console.log(`${result.length} productos cargados exitosamente`);

    // Mostrar los productos cargados
    console.log('Productos cargados:');
    result.forEach(producto => {
      console.log(`- ${producto.nombre} (${producto.categoria}): $${producto.precio} - Stock: ${producto.stock}`);
    });

  } catch (error) {
    console.error('Error al cargar productos:', error);
  } finally {
    // Cerrar la conexión a MongoDB
    mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar la función
cargarProductos();
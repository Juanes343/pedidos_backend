/**
 * Configuración de conexión a MongoDB Atlas
 * Maneja la conexión a la base de datos con manejo de errores
 */

import mongoose from 'mongoose';

/**
 * Conecta a la base de datos MongoDB Atlas
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // Configuración de opciones de conexión
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    // Realizar conexión
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);

    // Manejo de eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });

    // Manejo de cierre graceful
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔒 Conexión MongoDB cerrada debido a terminación de la aplicación');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    
    // Mostrar mensaje específico para errores comunes
    if (error.message.includes('authentication failed')) {
      console.error('🔑 Verifica tus credenciales de MongoDB Atlas');
    } else if (error.message.includes('network')) {
      console.error('🌐 Verifica tu conexión a internet y la configuración de red');
    }
    
    process.exit(1);
  }
};

export default connectDB;
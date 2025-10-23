const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDatabase() {
  try {
    console.log('🔍 Verificando conexión a MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas');
    
    // Obtener información de la conexión
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📊 Base de datos actual: ${dbName}`);
    
    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log(`📋 Colecciones encontradas (${collections.length}):`);
    
    if (collections.length === 0) {
      console.log('   ⚠️  No hay colecciones en esta base de datos');
    } else {
      collections.forEach(collection => {
        console.log(`   - ${collection.name}`);
      });
    }
    
    // Verificar si existe la colección 'users'
    const usersCollection = collections.find(col => col.name === 'users');
    if (usersCollection) {
      console.log('\n👥 Verificando colección "users":');
      const userCount = await db.collection('users').countDocuments();
      console.log(`   📊 Total de usuarios: ${userCount}`);
      
      if (userCount > 0) {
        console.log('   📄 Usuarios encontrados:');
        const users = await db.collection('users').find({}).toArray();
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.nombre} (${user.email}) - ID: ${user._id}`);
        });
      }
    } else {
      console.log('\n⚠️  La colección "users" no existe aún');
    }
    
    // Listar todas las bases de datos disponibles
    console.log('\n🗄️  Bases de datos disponibles en el cluster:');
    const admin = db.admin();
    const databases = await admin.listDatabases();
    databases.databases.forEach(database => {
      console.log(`   - ${database.name} (${(database.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

verifyDatabase();
/**
 * Script para reiniciar la base de datos
 * Limpia todos los registros pero mantiene la estructura y datos esenciales
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function resetDatabase() {
    let connection;
    
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'academia_pilates',
            multipleStatements: true
        });

        console.log('✅ Conectado a la base de datos');

        // Leer el script SQL
        const sqlPath = path.join(__dirname, '..', 'migrations', 'reset_database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🔄 Ejecutando script de reinicio...');
        
        // Ejecutar el script
        await connection.query(sql);

        console.log('✅ Base de datos reiniciada correctamente');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Crea un nuevo usuario admin desde el sistema o directamente en la BD');
        console.log('   2. El contenido de "Sobre Nosotros" se mantiene (puedes editarlo desde el admin)');
        console.log('   3. Las clases y horarios están listos para usar\n');

    } catch (error) {
        console.error('❌ Error al reiniciar la base de datos:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar
resetDatabase();


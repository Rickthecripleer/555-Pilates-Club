const { query, testConnection } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function verificarYCrearTabla() {
    try {
        console.log('🔍 Verificando conexión a la base de datos...');
        const conectado = await testConnection();
        
        if (!conectado) {
            console.error('❌ No se pudo conectar a la base de datos');
            process.exit(1);
        }

        console.log('✅ Conexión establecida\n');

        // Verificar si la tabla existe
        try {
            await query('SELECT 1 FROM contenido_nosotros LIMIT 1');
            console.log('✅ La tabla contenido_nosotros ya existe');
            
            // Contar registros
            const count = await query('SELECT COUNT(*) as total FROM contenido_nosotros');
            console.log(`📊 Registros en la tabla: ${count[0].total}\n`);
            
            return true;
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log('⚠️  La tabla contenido_nosotros no existe');
                console.log('📝 Creando tabla...\n');
                
                // Leer y ejecutar la migración
                const migrationPath = path.join(__dirname, '../migrations/create_contenido_nosotros.sql');
                const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
                
                // Dividir por líneas y ejecutar cada comando SQL
                const statements = migrationSQL
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
                
                for (const statement of statements) {
                    if (statement.length > 0) {
                        try {
                            await query(statement);
                        } catch (err) {
                            // Ignorar errores de "ya existe" en CREATE TABLE
                            if (!err.message.includes('already exists')) {
                                console.error('Error ejecutando:', statement.substring(0, 50));
                                throw err;
                            }
                        }
                    }
                }
                
                console.log('✅ Tabla creada exitosamente');
                
                // Verificar registros insertados
                const count = await query('SELECT COUNT(*) as total FROM contenido_nosotros');
                console.log(`📊 Registros insertados: ${count[0].total}\n`);
                
                return true;
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\n💡 Asegúrate de:');
        console.error('   1. Que la base de datos esté corriendo');
        console.error('   2. Que las credenciales en .env sean correctas');
        console.error('   3. Que tengas permisos para crear tablas\n');
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarYCrearTabla()
        .then(() => {
            console.log('✨ Proceso completado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { verificarYCrearTabla };


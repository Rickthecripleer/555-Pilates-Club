/**
 * Script para configurar la base de datos MySQL (Railway o Aiven)
 * Ejecuta el script SQL completo en la base de datos MySQL
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Credenciales desde variables de entorno (Railway o Aiven)
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'academia_pilates',
    multipleStatements: true // Permite ejecutar múltiples sentencias SQL
};

// SSL solo para Aiven (Railway puede no requerirlo)
if (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud')) {
    config.ssl = {
        rejectUnauthorized: false
    };
}

async function setupDatabase() {
    let connection;
    
    try {
        console.log('🔌 Conectando a la base de datos...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conectado exitosamente!\n');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, '..', 'setup_database_aiven.sql');
        console.log('📖 Leyendo script SQL...');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('✅ Script leído correctamente\n');

        // Dividir el script en sentencias individuales
        // Mejor método: dividir por ';' pero mantener sentencias completas
        let statements = [];
        let currentStatement = '';
        const lines = sql.split('\n');
        
        for (let line of lines) {
            const trimmedLine = line.trim();
            
            // Saltar líneas vacías y comentarios completos
            if (trimmedLine.length === 0 || trimmedLine.startsWith('--') || trimmedLine.startsWith('/*')) {
                continue;
            }
            
            // Agregar línea a la sentencia actual
            currentStatement += (currentStatement ? ' ' : '') + trimmedLine;
            
            // Si la línea termina con ';', es el final de una sentencia
            if (trimmedLine.endsWith(';')) {
                const statement = currentStatement.slice(0, -1).trim(); // Quitar el ';' final
                if (statement.length > 0 && !statement.startsWith('--')) {
                    statements.push(statement);
                }
                currentStatement = '';
            }
        }
        
        // Si queda una sentencia sin ';' al final, agregarla
        if (currentStatement.trim().length > 0) {
            statements.push(currentStatement.trim());
        }

        console.log(`📝 Encontradas ${statements.length} sentencias SQL para ejecutar...\n`);

        let executed = 0;
        let errors = 0;
        const errorDetails = [];

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Saltar si está vacío
            if (!statement || statement.length === 0) {
                continue;
            }
            
            try {
                // Ejecutar la sentencia (agregar ';' si no lo tiene)
                const sqlToExecute = statement.endsWith(';') ? statement : statement + ';';
                await connection.query(sqlToExecute);
                executed++;
                
                // Mostrar progreso cada 5 sentencias
                if (executed % 5 === 0) {
                    process.stdout.write(`\r⏳ Progreso: ${executed}/${statements.length} sentencias ejecutadas...`);
                }
            } catch (error) {
                // Ignorar errores esperados (tablas/registros ya existen)
                if (error.message.includes('already exists') || 
                    error.message.includes('Duplicate entry') ||
                    error.message.includes('Duplicate key') ||
                    error.message.includes('Duplicate column name')) {
                    // Ignorar silenciosamente - es normal si se ejecuta dos veces
                    executed++;
                } else {
                    errors++;
                    const errorInfo = {
                        index: i + 1,
                        message: error.message,
                        statement: statement.substring(0, 200)
                    };
                    errorDetails.push(errorInfo);
                    console.error(`\n❌ Error en sentencia ${i + 1}/${statements.length}:`, error.message);
                    console.error(`   Tipo: ${statement.substring(0, 50).toUpperCase()}...`);
                }
            }
        }
        
        console.log(`\n\n📊 Resumen:`);
        console.log(`   ✅ Ejecutadas correctamente: ${executed} sentencias`);
        if (errors > 0) {
            console.log(`   ⚠️  Errores: ${errors} sentencias`);
            console.log(`\n🔍 Detalles de errores:`);
            errorDetails.forEach(err => {
                console.log(`   - Sentencia ${err.index}: ${err.message}`);
            });
        } else {
            console.log(`   🎉 ¡Todas las sentencias se ejecutaron sin errores!`);
        }

        console.log('\n✅ Script ejecutado completamente!\n');

        // Verificar las tablas creadas
        console.log('\n🔍 Verificando tablas creadas...\n');
        
        try {
            const [tables] = await connection.query('SHOW TABLES');
            console.log(`📊 Tablas encontradas: ${tables.length}`);
            if (tables.length > 0) {
                tables.forEach(table => {
                    console.log(`   ✅ ${Object.values(table)[0]}`);
                });
            } else {
                console.log('   ⚠️  No se encontraron tablas. Puede que haya habido errores.');
            }
        } catch (error) {
            console.error('   ❌ Error al verificar tablas:', error.message);
        }

        // Verificar datos en tablas principales
        console.log('\n📊 Verificando datos insertados:\n');
        
        const tablesToCheck = [
            { name: 'clases', label: '📚 Clases' },
            { name: 'horarios', label: '⏰ Horarios' },
            { name: 'contenido_nosotros', label: '📝 Contenido' },
            { name: 'usuarios', label: '👥 Usuarios' }
        ];

        for (const table of tablesToCheck) {
            try {
                const [result] = await connection.query(`SELECT COUNT(*) as total FROM ${table.name}`);
                console.log(`${table.label}: ${result[0].total} registros`);
            } catch (error) {
                if (error.message.includes("doesn't exist")) {
                    console.log(`${table.label}: ❌ Tabla no existe`);
                } else {
                    console.log(`${table.label}: ⚠️  Error: ${error.message}`);
                }
            }
        }
        
        console.log('');

        console.log('✅ ¡Base de datos configurada correctamente!');
        console.log('\n🎉 Próximo paso: Desplegar en Render\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            console.error('\n💡 Sugerencia: Verifica que:');
            console.error('   1. Las credenciales sean correctas');
            console.error('   2. El servicio MySQL esté activo');
            console.error('   3. Tu conexión a internet esté funcionando');
        }
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\n💡 Sugerencia: Verifica el usuario y contraseña');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar
setupDatabase();


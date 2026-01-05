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
        // MySQL puede tener problemas con múltiples statements, así que las ejecutamos una por una
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        console.log(`📝 Ejecutando ${statements.length} sentencias SQL...\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            // Saltar comentarios y líneas vacías
            if (statement.length < 10 || statement.startsWith('SELECT') && statement.includes('AS mensaje')) {
                continue;
            }
            
            try {
                await connection.query(statement + ';');
                if ((i + 1) % 10 === 0) {
                    process.stdout.write(`\r⏳ Progreso: ${i + 1}/${statements.length} sentencias ejecutadas...`);
                }
            } catch (error) {
                // Ignorar errores de "table already exists" o "duplicate key"
                if (!error.message.includes('already exists') && 
                    !error.message.includes('Duplicate entry') &&
                    !error.message.includes('Duplicate key')) {
                    console.error(`\n❌ Error en sentencia ${i + 1}:`, error.message);
                    console.error(`Sentencia: ${statement.substring(0, 100)}...`);
                }
            }
        }

        console.log('\n✅ Script ejecutado completamente!\n');

        // Verificar las tablas creadas
        console.log('🔍 Verificando tablas creadas...\n');
        
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📊 Tablas encontradas: ${tables.length}`);
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });

        // Verificar clases
        const [clases] = await connection.query('SELECT COUNT(*) as total FROM clases');
        console.log(`\n📚 Clases: ${clases[0].total}`);

        // Verificar horarios
        const [horarios] = await connection.query('SELECT COUNT(*) as total FROM horarios');
        console.log(`⏰ Horarios: ${horarios[0].total}`);

        // Verificar contenido
        const [contenido] = await connection.query('SELECT COUNT(*) as total FROM contenido_nosotros');
        console.log(`📝 Contenido: ${contenido[0].total}\n`);

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


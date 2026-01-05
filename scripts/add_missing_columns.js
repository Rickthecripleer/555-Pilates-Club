/**
 * Script para agregar columnas faltantes a la tabla reservaciones
 * Ejecuta este script después de setup_aiven_database.js si hay errores de columnas faltantes
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Credenciales desde variables de entorno (Railway o Aiven)
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'academia_pilates'
};

// SSL solo para Aiven (Railway puede no requerirlo)
if (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud')) {
    config.ssl = {
        rejectUnauthorized: false
    };
}

async function addMissingColumns() {
    let connection;
    
    try {
        console.log('🔌 Conectando a la base de datos...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conectado exitosamente!\n');

        console.log('📝 Agregando columnas faltantes a la tabla reservaciones...\n');

        // Agregar columna es_automatica
        try {
            await connection.execute(`
                ALTER TABLE reservaciones 
                ADD COLUMN es_automatica BOOLEAN DEFAULT FALSE
            `);
            console.log('✅ Columna es_automatica agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columna es_automatica ya existe');
            } else {
                throw error;
            }
        }

        // Agregar columna horario_fijo_id
        try {
            await connection.execute(`
                ALTER TABLE reservaciones 
                ADD COLUMN horario_fijo_id INT NULL
            `);
            console.log('✅ Columna horario_fijo_id agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️  Columna horario_fijo_id ya existe');
            } else {
                throw error;
            }
        }

        // Agregar foreign key (solo si la tabla alumna_horarios_fijos existe)
        try {
            await connection.execute(`
                ALTER TABLE reservaciones 
                ADD CONSTRAINT fk_reservaciones_horario_fijo 
                FOREIGN KEY (horario_fijo_id) REFERENCES alumna_horarios_fijos(id) 
                ON DELETE SET NULL ON UPDATE CASCADE
            `);
            console.log('✅ Foreign key agregada');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_CONSTRAINT_NAME') {
                console.log('⚠️  Foreign key ya existe');
            } else if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log('⚠️  Tabla alumna_horarios_fijos no existe, saltando foreign key');
            } else {
                throw error;
            }
        }

        // Agregar índices
        try {
            await connection.execute(`
                ALTER TABLE reservaciones 
                ADD INDEX idx_es_automatica (es_automatica)
            `);
            console.log('✅ Índice idx_es_automatica agregado');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Índice idx_es_automatica ya existe');
            } else {
                throw error;
            }
        }

        try {
            await connection.execute(`
                ALTER TABLE reservaciones 
                ADD INDEX idx_horario_fijo_id (horario_fijo_id)
            `);
            console.log('✅ Índice idx_horario_fijo_id agregado');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Índice idx_horario_fijo_id ya existe');
            } else {
                throw error;
            }
        }

        console.log('\n✅ ¡Columnas agregadas correctamente!');
        console.log('\n🎉 Ahora puedes recargar la página de Asistencia\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar
addMissingColumns();


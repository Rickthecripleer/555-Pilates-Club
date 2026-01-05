/**
 * Script para crear el usuario administrador en la base de datos MySQL (Railway o Aiven)
 * Ejecuta este script después de setup_aiven_database.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

async function createAdminUser() {
    let connection;
    
    try {
        console.log('🔌 Conectando a la base de datos...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conectado exitosamente!\n');

        // Datos del usuario administrador
        const email = 'Moralesterron1995@outlook.es';
        const passwordHash = '$2a$10$ZnPn4ca0c.9tBAprp.AX0eVzISio19OxxkL/qRVtkYj5QIhSgUhty'; // Hashed password for 'Keepitjuicy1505*'
        const nombre = 'Sodelva Guadalupe Morales Terrón';
        const rol = 'admin';
        const activo = true;

        console.log('📝 Creando usuario administrador...\n');

        // Insertar o actualizar el usuario admin
        const sql = `
            INSERT INTO usuarios (email, password, rol, nombre, activo)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                password = VALUES(password),
                nombre = VALUES(nombre),
                rol = 'admin',
                activo = TRUE;
        `;
        
        await connection.execute(sql, [email, passwordHash, rol, nombre, activo]);
        console.log('✅ Usuario administrador creado/actualizado correctamente!\n');

        // Verificar que el usuario se creó
        console.log('🔍 Verificando usuario admin...\n');
        const [users] = await connection.query(
            'SELECT id, nombre, email, rol, activo FROM usuarios WHERE email = ?',
            ['Moralesterron1995@outlook.es']
        );

        if (users.length > 0) {
            console.log('✅ Usuario administrador creado correctamente:');
            console.log(`   ID: ${users[0].id}`);
            console.log(`   Nombre: ${users[0].nombre}`);
            console.log(`   Email: ${users[0].email}`);
            console.log(`   Rol: ${users[0].rol}`);
            console.log(`   Activo: ${users[0].activo ? 'Sí' : 'No'}\n`);
        } else {
            console.log('⚠️  No se encontró el usuario admin');
        }

        console.log('🎉 ¡Proceso completado!\n');

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

        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('\n💡 Sugerencia: Primero ejecuta setup_aiven_database.js para crear las tablas');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar
createAdminUser();


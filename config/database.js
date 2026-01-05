const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'academia_pilates',
    port: parseInt(process.env.DB_PORT) || 3306, // Asegurar que sea número
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
};

// SSL solo para Aiven (Railway puede no requerirlo)
if (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud')) {
    dbConfig.ssl = {
        rejectUnauthorized: false
    };
}

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para ejecutar consultas
const query = async (sql, params = []) => {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error en consulta SQL:', error);
        throw error;
    }
};

// Función para obtener una conexión del pool (para transacciones)
const getConnection = async () => {
    return await pool.getConnection();
};

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos establecida');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        return false;
    }
};

module.exports = {
    pool,
    query,
    getConnection,
    testConnection
};










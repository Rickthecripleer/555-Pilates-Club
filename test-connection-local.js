/**
 * Script para probar conexión a Aiven MySQL desde tu computadora local
 * Esto nos ayudará a diagnosticar si el problema es específico de Render o general
 */

const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('🔌 Probando conexión a Aiven MySQL desde tu computadora local...\n');
    
    const config = {
        host: 'switchyard.proxy.rlwy.net',
        port: 55856,
        user: 'root',
        password: 'zWWBeaXeMuCmnzaLHaebZluRRnjBccRv',
        database: 'railway',
        ssl: {
            rejectUnauthorized: false
        }
    };

    try {
        console.log('📝 Configuración:');
        console.log(`   Host: ${config.host}`);
        console.log(`   Port: ${config.port}`);
        console.log(`   User: ${config.user}`);
        console.log(`   Database: ${config.database}`);
        console.log(`   SSL: Habilitado\n`);

        const connection = await mysql.createConnection(config);
        console.log('✅ ¡CONECTADO EXITOSAMENTE desde tu computadora local!');
        
        // Probar una consulta simple
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Consulta de prueba ejecutada correctamente');
        console.log(`   Resultado: ${JSON.stringify(rows)}\n`);
        
        await connection.end();
        console.log('🔌 Conexión cerrada\n');
        
        console.log('📊 CONCLUSIÓN:');
        console.log('   Si esto funciona, el problema es específico de Render/IP');
        console.log('   Si esto NO funciona, el problema es de credenciales/SSL/Network Access\n');
        
        return true;
    } catch (error) {
        console.error('❌ ERROR al conectar:');
        console.error(`   Mensaje: ${error.message}`);
        console.error(`   Código: ${error.code}\n`);
        
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
            console.log('💡 Esto indica un problema de red o que Aiven no permite conexiones externas');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.message.includes('Access denied')) {
            console.log('💡 Esto indica que Aiven está rechazando la conexión (Network Access o credenciales)');
        } else if (error.code === 'ENOTFOUND') {
            console.log('💡 Esto indica que el hostname no se puede resolver');
        }
        
        return false;
    }
}

testConnection();


const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const claseRoutes = require('./routes/claseRoutes');
const reservacionRoutes = require('./routes/reservacionRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const adminRoutes = require('./routes/adminRoutes');
const horarioFijoRoutes = require('./routes/horarioFijoRoutes');
const cambioHorarioRoutes = require('./routes/cambioHorarioRoutes');
const contenidoRoutes = require('./routes/contenidoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
// CORS: En producción, especifica los orígenes permitidos
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://tu-dominio.com'])
    : true; // En desarrollo permite cualquier origen

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (comprobantes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de salud
app.get('/health', async (req, res) => {
    const dbConnected = await testConnection();
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/clases', claseRoutes);
app.use('/api/reservaciones', reservacionRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/horarios-fijos', horarioFijoRoutes);
app.use('/api/cambios-horario', cambioHorarioRoutes);
app.use('/api/contenido', contenidoRoutes);

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado'
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    
    // Error de multer (archivo muy grande)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
        });
    }

    // Error de multer (tipo de archivo no permitido)
    if (err.message && err.message.includes('Solo se permiten archivos de imagen')) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Accesible desde la red en: http://192.168.1.10:${PORT}`);
    console.log(`📁 Entorno: ${process.env.NODE_ENV || 'development'}`);
    
    // Probar conexión a la base de datos
    await testConnection();
    
    console.log(`\n📋 Endpoints disponibles:`);
    console.log(`   GET  /health`);
    console.log(`   POST /api/auth/login`);
    console.log(`   GET  /api/auth/me`);
    console.log(`   GET  /api/clases/disponibles`);
    console.log(`   GET  /api/reservaciones/verificar-acceso`);
    console.log(`   GET  /api/reservaciones/mis-reservaciones`);
    console.log(`   POST /api/reservaciones`);
    console.log(`   GET  /api/pagos/mis-pagos`);
    console.log(`   POST /api/pagos/comprobante`);
    console.log(`   GET  /api/admin/pagos/pendientes (admin)`);
    console.log(`   GET  /api/admin/pagos (admin)`);
    console.log(`   PUT  /api/admin/pagos/:id/validar (admin)\n`);
});

module.exports = app;


const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Middleware para verificar el token JWT
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticación no proporcionado'
            });
        }

        const token = authHeader.substring(7); // Remover "Bearer "

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Obtener usuario de la base de datos
        const usuarios = await query(
            'SELECT id, email, rol, nombre, telefono, creditos_disponibles, activo FROM usuarios WHERE id = ? AND activo = TRUE',
            [decoded.userId]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        // Agregar información del usuario al request
        req.user = usuarios[0];
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Error en la autenticación',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    if (req.user.rol !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requieren permisos de administrador'
        });
    }

    next();
};

/**
 * Middleware para verificar que el usuario sea alumna
 */
const requireAlumna = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Autenticación requerida'
        });
    }

    if (req.user.rol !== 'alumna') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Este endpoint es solo para alumnas'
        });
    }

    next();
};

/**
 * Función para generar token JWT
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

module.exports = {
    authenticate,
    requireAdmin,
    requireAlumna,
    generateToken
};










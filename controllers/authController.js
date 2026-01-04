const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { enviarEmailRecuperacion } = require('../services/emailService');

/**
 * POST /api/auth/login
 * Iniciar sesión (para alumnas y admins)
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const usuarios = await query(
            'SELECT id, email, password, rol, nombre, telefono, activo FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const usuario = usuarios[0];

        // Verificar si el usuario está activo
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        // Verificar contraseña
        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = generateToken(usuario.id);

        // Remover password de la respuesta
        delete usuario.password;

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: usuario
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

/**
 * POST /api/auth/register
 * Registrar nueva alumna (público)
 */
const register = async (req, res) => {
    try {
        const { email, password, nombre, telefono } = req.body;

        // Validaciones básicas
        if (!email || !password || !nombre) {
            return res.status(400).json({
                success: false,
                message: 'Email, contraseña y nombre son requeridos'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el email ya existe
        const usuariosExistentes = await query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Este email ya está registrado'
            });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario (solo como alumna)
        const resultado = await query(
            `INSERT INTO usuarios (email, password, rol, nombre, telefono) 
             VALUES (?, ?, 'alumna', ?, ?)`,
            [email, hashedPassword, nombre, telefono || null]
        );

        // Obtener el usuario creado
        const nuevosUsuarios = await query(
            'SELECT id, email, rol, nombre, telefono FROM usuarios WHERE id = ?',
            [resultado.insertId]
        );

        const nuevoUsuario = nuevosUsuarios[0];

        // Generar token
        const token = generateToken(nuevoUsuario.id);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                token,
                user: nuevoUsuario
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
const getMe = async (req, res) => {
    try {
        // El usuario ya está en req.user gracias al middleware authenticate
        res.json({
            success: true,
            data: req.user
        });
    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información del usuario',
            error: error.message
        });
    }
};

/**
 * POST /api/auth/forgot-password
 * Solicitar recuperación de contraseña
 * NOTA: Por ahora solo valida que el email exista.
 * Para producción, deberías:
 * 1. Generar un token único
 * 2. Guardarlo en la BD con expiración
 * 3. Enviar email con link de recuperación
 * 4. Crear endpoint para reset-password con el token
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email es requerido'
            });
        }

        // Verificar si el usuario existe
        const usuarios = await query(
            'SELECT id, email, nombre FROM usuarios WHERE email = ?',
            [email]
        );

        // Por seguridad, siempre devolvemos éxito (aunque el email no exista)
        // Esto previene que alguien pueda verificar qué emails están registrados
        if (usuarios.length === 0) {
            return res.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
            });
        }

        const usuario = usuarios[0];

        // Generar token único de recuperación
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date();
        resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Expira en 1 hora

        // Guardar token en la base de datos
        await query(
            'UPDATE usuarios SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, resetTokenExpires, usuario.id]
        );

        // Enviar email de recuperación
        const emailEnviado = await enviarEmailRecuperacion(
            usuario.email,
            usuario.nombre,
            resetToken
        );

        if (!emailEnviado) {
            console.warn('⚠️ No se pudo enviar el email, pero el token fue generado');
        }

        res.json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
        });
    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar solicitud de recuperación',
            error: error.message
        });
    }
};

/**
 * POST /api/auth/reset-password
 * Resetear contraseña con token
 */
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        console.log('🔐 Reset password request recibido');
        console.log('Token recibido:', token ? `${token.substring(0, 10)}...` : 'NO HAY TOKEN');
        console.log('Nueva contraseña recibida:', newPassword ? 'SÍ' : 'NO');

        if (!token || !newPassword) {
            console.log('❌ Faltan token o contraseña');
            return res.status(400).json({
                success: false,
                message: 'Token y nueva contraseña son requeridos'
            });
        }

        if (newPassword.length < 6) {
            console.log('❌ Contraseña muy corta');
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Buscar usuario con token válido
        console.log('🔍 Buscando usuario con token...');
        const usuarios = await query(
            `SELECT id, email, nombre, reset_token_expires FROM usuarios 
             WHERE reset_token = ? 
             AND reset_token_expires > NOW()`,
            [token]
        );

        console.log('Usuarios encontrados:', usuarios.length);

        if (usuarios.length === 0) {
            // Verificar si el token existe pero está expirado
            const usuariosExpirados = await query(
                `SELECT id FROM usuarios WHERE reset_token = ?`,
                [token]
            );
            
            if (usuariosExpirados.length > 0) {
                console.log('❌ Token expirado');
                return res.status(400).json({
                    success: false,
                    message: 'El token ha expirado. Solicita un nuevo enlace de recuperación.'
                });
            }
            
            console.log('❌ Token no encontrado');
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        const usuario = usuarios[0];
        console.log('✅ Usuario encontrado:', usuario.email);

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Actualizar contraseña y limpiar token
        await query(
            `UPDATE usuarios 
             SET password = ?, reset_token = NULL, reset_token_expires = NULL 
             WHERE id = ?`,
            [hashedPassword, usuario.id]
        );

        console.log('✅ Contraseña actualizada exitosamente para:', usuario.email);

        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        console.error('❌ Error en reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al resetear contraseña',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    login,
    register,
    getMe,
    forgotPassword,
    resetPassword
};

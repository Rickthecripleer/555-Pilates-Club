const reservacionService = require('../services/reservacionService');

/**
 * POST /api/reservaciones
 * Crear una nueva reservación
 */
const crearReservacion = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const { horario_id, fecha_reserva } = req.body;

        // Convertir fecha a objeto Date
        const fechaReserva = new Date(fecha_reserva);

        // Crear la reservación
        const reservacion = await reservacionService.crearReservacion(
            alumnaId,
            horario_id,
            fechaReserva
        );

        res.status(201).json({
            success: true,
            message: 'Reservación creada exitosamente',
            data: reservacion
        });
    } catch (error) {
        console.error('Error al crear reservación:', error);
        
        // Errores de validación de negocio
        if (error.message.includes('No tiene créditos') || 
            error.message.includes('No hay lugares') ||
            error.message.includes('Ya tienes una reservación')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear la reservación',
            error: error.message
        });
    }
};

/**
 * GET /api/reservaciones/mis-reservaciones
 * Obtener reservaciones de la alumna autenticada
 */
const getMisReservaciones = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const { estatus, fecha_desde, fecha_hasta } = req.query;

        const reservaciones = await reservacionService.getReservacionesAlumna(alumnaId, {
            estatus,
            fecha_desde,
            fecha_hasta
        });

        res.json({
            success: true,
            data: reservaciones,
            total: reservaciones.length
        });
    } catch (error) {
        console.error('Error al obtener reservaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservaciones',
            error: error.message
        });
    }
};

/**
 * GET /api/reservaciones/verificar-acceso
 * Verificar si la alumna tiene acceso para reservar
 */
const verificarAcceso = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const acceso = await reservacionService.verificarAccesoReservacion(alumnaId);

        res.json({
            success: true,
            data: acceso
        });
    } catch (error) {
        console.error('Error al verificar acceso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar acceso',
            error: error.message
        });
    }
};

/**
 * PUT /api/reservaciones/:id/cancelar
 * Cancelar una reservación
 */
const cancelarReservacion = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const { id } = req.params;

        const reservacion = await reservacionService.cancelarReservacion(alumnaId, parseInt(id));

        res.json({
            success: true,
            message: 'Reservación cancelada exitosamente',
            data: reservacion
        });
    } catch (error) {
        console.error('Error al cancelar reservación:', error);
        
        if (error.message.includes('no encontrada') || 
            error.message.includes('ya fue cancelada') ||
            error.message.includes('No se pueden cancelar')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al cancelar la reservación',
            error: error.message
        });
    }
};

module.exports = {
    crearReservacion,
    getMisReservaciones,
    verificarAcceso,
    cancelarReservacion
};









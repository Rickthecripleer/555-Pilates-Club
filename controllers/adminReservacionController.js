const adminReservacionService = require('../services/adminReservacionService');

/**
 * GET /api/admin/reservaciones/dia
 * Obtener reservaciones de un día específico agrupadas por horario
 */
const getReservacionesPorDia = async (req, res) => {
    try {
        const { fecha } = req.query;

        if (!fecha) {
            return res.status(400).json({
                success: false,
                message: 'La fecha es requerida (formato: YYYY-MM-DD)'
            });
        }

        // Validar formato de fecha
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fecha)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de fecha inválido. Use YYYY-MM-DD'
            });
        }

        const reservaciones = await adminReservacionService.getReservacionesPorDia(fecha);

        res.json({
            success: true,
            data: reservaciones,
            fecha: fecha,
            total_horarios: reservaciones.length,
            total_reservaciones: reservaciones.reduce((sum, h) => sum + h.total_reservaciones, 0)
        });
    } catch (error) {
        console.error('Error al obtener reservaciones por día:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reservaciones',
            error: error.message
        });
    }
};

/**
 * GET /api/admin/reservaciones/resumen
 * Obtener resumen de reservaciones por rango de fechas
 */
const getResumenReservaciones = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                success: false,
                message: 'fecha_inicio y fecha_fin son requeridos (formato: YYYY-MM-DD)'
            });
        }

        const resumen = await adminReservacionService.getResumenReservacionesPorSemana(fecha_inicio, fecha_fin);

        res.json({
            success: true,
            data: resumen,
            fecha_inicio,
            fecha_fin
        });
    } catch (error) {
        console.error('Error al obtener resumen de reservaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen',
            error: error.message
        });
    }
};

module.exports = {
    getReservacionesPorDia,
    getResumenReservaciones
};



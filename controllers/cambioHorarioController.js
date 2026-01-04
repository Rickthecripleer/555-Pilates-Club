const cambioHorarioService = require('../services/cambioHorarioService');
const { query } = require('../config/database');

/**
 * GET /api/cambios-horario/info
 * Obtener información sobre cambios de horario disponibles
 */
const getInfoCambios = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const info = await cambioHorarioService.getInfoCambiosHorario(alumnaId);

        res.json({
            success: true,
            data: info
        });
    } catch (error) {
        console.error('Error al obtener información de cambios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información de cambios',
            error: error.message
        });
    }
};

/**
 * POST /api/cambios-horario/registrar
 * Registrar un cambio de horario (cuando la alumna cancela múltiples reservaciones de un horario y reserva otro)
 */
const registrarCambioHorario = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const { horario_anterior_id, horario_nuevo_id, motivo } = req.body;

        if (!horario_anterior_id || !horario_nuevo_id) {
            return res.status(400).json({
                success: false,
                message: 'horario_anterior_id y horario_nuevo_id son requeridos'
            });
        }

        if (horario_anterior_id === horario_nuevo_id) {
            return res.status(400).json({
                success: false,
                message: 'El horario anterior y nuevo deben ser diferentes'
            });
        }

        // Obtener el pago mensual activo
        const pagos = await query(
            `SELECT id FROM pagos 
             WHERE alumna_id = ? 
             AND tipo_plan = 'mensual' 
             AND estatus = 'completado'
             AND (fecha_vencimiento_plan IS NULL OR fecha_vencimiento_plan >= CURDATE())
             ORDER BY fecha_creacion DESC 
             LIMIT 1`,
            [alumnaId]
        );

        if (pagos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No tienes un plan mensual activo'
            });
        }

        const pagoId = pagos[0].id;

        // Registrar el cambio
        const resultado = await cambioHorarioService.registrarCambioHorario(
            alumnaId,
            pagoId,
            horario_anterior_id,
            horario_nuevo_id,
            motivo
        );

        res.json({
            success: true,
            message: 'Cambio de horario registrado exitosamente',
            data: resultado
        });
    } catch (error) {
        console.error('Error al registrar cambio de horario:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al registrar cambio de horario',
            error: error.message
        });
    }
};

module.exports = {
    getInfoCambios,
    registrarCambioHorario
};



const horarioFijoService = require('../services/horarioFijoService');
const { calcularFechaVencimiento } = require('../services/pagoService');

/**
 * GET /api/horarios-fijos/verificar-necesidad
 * Verificar si la alumna necesita seleccionar horarios fijos
 */
const verificarNecesidadHorariosFijos = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const resultado = await horarioFijoService.verificarNecesitaHorariosFijos(alumnaId);

        res.json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al verificar necesidad de horarios fijos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar necesidad de horarios fijos',
            error: error.message
        });
    }
};

/**
 * POST /api/horarios-fijos/crear
 * Crear horarios fijos para la alumna autenticada
 */
const crearHorariosFijosAlumna = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const { pago_id, horarios_ids } = req.body;

        if (!pago_id || !horarios_ids || !Array.isArray(horarios_ids)) {
            return res.status(400).json({
                success: false,
                message: 'pago_id y horarios_ids (array) son requeridos'
            });
        }

        // Verificar que el pago pertenece a la alumna
        const { query } = require('../config/database');
        const pagos = await query(
            'SELECT id, tipo_plan, fecha_pago, fecha_vencimiento_plan FROM pagos WHERE id = ? AND alumna_id = ? AND estatus = ?',
            [pago_id, alumnaId, 'completado']
        );

        if (pagos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado o no pertenece a la alumna'
            });
        }

        const pago = pagos[0];

        // Calcular fechas si no están en el pago
        let fechaInicio = new Date(pago.fecha_pago);
        let fechaFin = pago.fecha_vencimiento_plan ? new Date(pago.fecha_vencimiento_plan) : calcularFechaVencimiento(fechaInicio, pago.tipo_plan);

        if (!fechaFin) {
            fechaFin = new Date(fechaInicio);
            fechaFin.setMonth(fechaFin.getMonth() + 1);
        }

        // Crear horarios fijos
        const horariosFijos = await horarioFijoService.crearHorariosFijos(
            alumnaId,
            pago_id,
            pago.tipo_plan,
            horarios_ids,
            fechaInicio,
            fechaFin
        );

        res.json({
            success: true,
            message: 'Horarios fijos creados exitosamente',
            data: horariosFijos
        });
    } catch (error) {
        console.error('Error al crear horarios fijos:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al crear horarios fijos',
            error: error.message
        });
    }
};

/**
 * GET /api/horarios-fijos/disponibles
 * Obtener horarios disponibles para selección según tipo de plan
 */
const getHorariosDisponibles = async (req, res) => {
    try {
        const { tipo_plan, fecha_inicio, fecha_fin } = req.query;

        if (!tipo_plan || (tipo_plan !== 'mensual' && tipo_plan !== 'semanal')) {
            return res.status(400).json({
                success: false,
                message: 'tipo_plan es requerido y debe ser "mensual" o "semanal"'
            });
        }

        // Si no se proporcionan fechas, calcular según tipo de plan
        let fechaInicio, fechaFin;
        if (fecha_inicio && fecha_fin) {
            fechaInicio = new Date(fecha_inicio);
            fechaFin = new Date(fecha_fin);
        } else {
            const hoy = new Date();
            fechaInicio = new Date(hoy);
            fechaFin = tipo_plan === 'mensual' 
                ? new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
                : new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        const horarios = await horarioFijoService.getHorariosDisponiblesParaPlan(
            tipo_plan,
            fechaInicio,
            fechaFin
        );

        res.json({
            success: true,
            data: horarios,
            total: horarios.length
        });
    } catch (error) {
        console.error('Error al obtener horarios disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horarios disponibles',
            error: error.message
        });
    }
};

/**
 * GET /api/horarios-fijos/mis-horarios
 * Obtener horarios fijos activos de la alumna autenticada
 */
const getMisHorariosFijos = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const horarios = await horarioFijoService.getHorariosFijosAlumna(alumnaId);

        res.json({
            success: true,
            data: horarios,
            total: horarios.length
        });
    } catch (error) {
        console.error('Error al obtener horarios fijos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horarios fijos',
            error: error.message
        });
    }
};

module.exports = {
    verificarNecesidadHorariosFijos,
    crearHorariosFijosAlumna,
    getHorariosDisponibles,
    getMisHorariosFijos
};


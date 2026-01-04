const { query, getConnection } = require('../config/database');

/**
 * Verificar cuántos cambios de horario ha hecho una alumna en su plan mensual actual
 * @param {number} alumnaId - ID de la alumna
 * @param {number} pagoId - ID del pago mensual
 * @returns {Promise<Object>} { cambiosRealizados: number, puedeCambiar: boolean }
 */
const verificarCambiosDisponibles = async (alumnaId, pagoId) => {
    const cambios = await query(
        `SELECT COUNT(*) as total 
         FROM cambios_horario_mensual 
         WHERE alumna_id = ? AND pago_id = ?`,
        [alumnaId, pagoId]
    );

    const cambiosRealizados = cambios[0]?.total || 0;
    const LIMITE_CAMBIOS = 1; // Máximo 1 cambio por mes

    return {
        cambiosRealizados,
        cambiosDisponibles: Math.max(0, LIMITE_CAMBIOS - cambiosRealizados),
        puedeCambiar: cambiosRealizados < LIMITE_CAMBIOS,
        limiteCambios: LIMITE_CAMBIOS
    };
};

/**
 * Registrar un cambio de horario
 * @param {number} alumnaId - ID de la alumna
 * @param {number} pagoId - ID del pago mensual
 * @param {number} horarioAnteriorId - ID del horario anterior
 * @param {number} horarioNuevoId - ID del horario nuevo
 * @param {string} motivo - Motivo del cambio (opcional)
 * @returns {Promise<Object>} Cambio registrado
 */
const registrarCambioHorario = async (alumnaId, pagoId, horarioAnteriorId, horarioNuevoId, motivo = null) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Verificar que puede cambiar
        const verificacion = await verificarCambiosDisponibles(alumnaId, pagoId);
        if (!verificacion.puedeCambiar) {
            throw new Error('Ya has usado tu cambio de horario permitido para este mes');
        }

        // Registrar el cambio
        const resultado = await query(
            `INSERT INTO cambios_horario_mensual 
             (alumna_id, pago_id, horario_anterior_id, horario_nuevo_id, motivo)
             VALUES (?, ?, ?, ?, ?)`,
            [alumnaId, pagoId, horarioAnteriorId, horarioNuevoId, motivo]
        );

        await connection.commit();

        return {
            id: resultado.insertId,
            cambiosRestantes: verificacion.cambiosDisponibles - 1
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Obtener información de cambios de horario para una alumna
 * @param {number} alumnaId - ID de la alumna
 * @param {number} pagoId - ID del pago mensual (opcional, si no se proporciona busca el activo)
 * @returns {Promise<Object>} Información de cambios
 */
const getInfoCambiosHorario = async (alumnaId, pagoId = null) => {
    let pagoIdFinal = pagoId;

    // Si no se proporciona pagoId, buscar el pago mensual activo
    if (!pagoIdFinal) {
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
            return {
                tienePlanMensual: false,
                cambiosRealizados: 0,
                cambiosDisponibles: 0,
                puedeCambiar: false
            };
        }

        pagoIdFinal = pagos[0].id;
    }

    const verificacion = await verificarCambiosDisponibles(alumnaId, pagoIdFinal);

    // Obtener historial de cambios
    const cambios = await query(
        `SELECT 
            ch.id,
            ch.horario_anterior_id,
            ch.horario_nuevo_id,
            ch.fecha_cambio,
            ch.motivo,
            h1.dia_semana as dia_anterior,
            h1.hora_inicio as hora_anterior,
            h2.dia_semana as dia_nuevo,
            h2.hora_inicio as hora_nuevo,
            c1.nombre_clase as clase_anterior,
            c2.nombre_clase as clase_nueva
         FROM cambios_horario_mensual ch
         INNER JOIN horarios h1 ON ch.horario_anterior_id = h1.id
         INNER JOIN horarios h2 ON ch.horario_nuevo_id = h2.id
         INNER JOIN clases c1 ON h1.clase_id = c1.id
         INNER JOIN clases c2 ON h2.clase_id = c2.id
         WHERE ch.alumna_id = ? AND ch.pago_id = ?
         ORDER BY ch.fecha_cambio DESC`,
        [alumnaId, pagoIdFinal]
    );

    return {
        tienePlanMensual: true,
        pagoId: pagoIdFinal,
        cambiosRealizados: verificacion.cambiosRealizados,
        cambiosDisponibles: verificacion.cambiosDisponibles,
        puedeCambiar: verificacion.puedeCambiar,
        limiteCambios: verificacion.limiteCambios,
        historial: cambios
    };
};

module.exports = {
    verificarCambiosDisponibles,
    registrarCambioHorario,
    getInfoCambiosHorario
};



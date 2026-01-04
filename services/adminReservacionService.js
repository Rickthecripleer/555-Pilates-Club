const { query } = require('../config/database');

/**
 * Obtener reservaciones de un día específico agrupadas por horario
 * Incluye información de la alumna y tipo de reservación (automática o manual)
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Array>} Lista de horarios con sus reservaciones
 */
const getReservacionesPorDia = async (fecha) => {
    // Obtener el día de la semana de la fecha
    const fechaObj = new Date(fecha + 'T12:00:00'); // Agregar hora para evitar problemas de zona horaria
    const diaSemanaNum = fechaObj.getDay(); // 0 = domingo, 1 = lunes, etc.
    const diasSemanaMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemanaMap[diaSemanaNum];

    const sql = `
        SELECT 
            h.id AS horario_id,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin,
            c.id AS clase_id,
            c.nombre_clase,
            c.capacidad_maxima,
            COUNT(DISTINCT r.id) AS total_reservaciones,
            GROUP_CONCAT(
                DISTINCT CONCAT(
                    r.id, '|',
                    u.id, '|',
                    u.nombre, '|',
                    COALESCE(u.telefono, ''), '|',
                    r.estatus, '|',
                    IF(r.es_automatica = 1, 'automatica', 'manual'), '|',
                    COALESCE(
                        (SELECT tipo_plan 
                         FROM pagos 
                         WHERE id = (
                             SELECT pago_id 
                             FROM alumna_horarios_fijos 
                             WHERE id = r.horario_fijo_id 
                             LIMIT 1
                         ) 
                         LIMIT 1), 
                        (SELECT tipo_plan 
                         FROM pagos 
                         WHERE alumna_id = u.id 
                         AND estatus = 'completado'
                         AND tipo_plan = 'mensual'
                         AND (fecha_vencimiento_plan IS NULL OR fecha_vencimiento_plan >= CURDATE())
                         ORDER BY fecha_creacion DESC 
                         LIMIT 1),
                        ''
                    ), '|',
                    COALESCE(
                        (SELECT monto 
                         FROM pagos 
                         WHERE id = (
                             SELECT pago_id 
                             FROM alumna_horarios_fijos 
                             WHERE id = r.horario_fijo_id 
                             LIMIT 1
                         ) 
                         LIMIT 1), 
                        0
                    )
                )
                ORDER BY 
                    IF(r.es_automatica = 1, 0, 1),
                    u.nombre
                SEPARATOR ';;'
            ) AS reservaciones_detalle
        FROM horarios h
        INNER JOIN clases c ON h.clase_id = c.id
        LEFT JOIN reservaciones r ON r.horario_id = h.id 
            AND r.fecha_reserva = ? 
            AND r.estatus IN ('confirmada', 'completada')
        LEFT JOIN usuarios u ON r.alumna_id = u.id
        WHERE h.activo = TRUE 
        AND c.activa = TRUE
        AND h.dia_semana = ?
        GROUP BY h.id, h.dia_semana, h.hora_inicio, h.hora_fin, c.id, c.nombre_clase, c.capacidad_maxima
        ORDER BY h.hora_inicio
    `;

    const horarios = await query(sql, [fecha, diaSemana]);

    // Procesar las reservaciones para cada horario
    const horariosConReservaciones = horarios.map(horario => {
        const reservaciones = [];
        
        if (horario.reservaciones_detalle) {
            const reservacionesArray = horario.reservaciones_detalle.split(';;');
            
            reservacionesArray.forEach(reservaStr => {
                const [reservaId, alumnaId, nombre, telefono, estatus, tipoReserva, tipoPlan, monto] = reservaStr.split('|');
                
                // Determinar si es mensualidad:
                // 1. Si es automática (tiene horario_fijo_id) -> es mensualidad
                // 2. Si tiene tipo_plan = 'mensual' -> es mensualidad (aunque sea reservación manual)
                const esMensualidad = tipoReserva === 'automatica' || tipoPlan === 'mensual';
                
                reservaciones.push({
                    id: parseInt(reservaId),
                    alumna_id: parseInt(alumnaId),
                    nombre_alumna: nombre,
                    telefono: telefono || null,
                    estatus: estatus,
                    es_automatica: tipoReserva === 'automatica',
                    es_mensualidad: esMensualidad, // Nueva propiedad para identificar mensualidad
                    tipo_plan: tipoPlan || null,
                    monto: monto ? parseFloat(monto) : null
                });
            });
        }

        return {
            horario_id: horario.horario_id,
            clase_id: horario.clase_id,
            nombre_clase: horario.nombre_clase,
            dia_semana: horario.dia_semana,
            hora_inicio: horario.hora_inicio,
            hora_fin: horario.hora_fin,
            capacidad_maxima: horario.capacidad_maxima,
            total_reservaciones: parseInt(horario.total_reservaciones) || 0,
            lugares_disponibles: horario.capacidad_maxima - (parseInt(horario.total_reservaciones) || 0),
            reservaciones: reservaciones.sort((a, b) => {
                // Ordenar: primero automáticas (mensualidad), luego manuales
                if (a.es_automatica && !b.es_automatica) return -1;
                if (!a.es_automatica && b.es_automatica) return 1;
                return a.nombre_alumna.localeCompare(b.nombre_alumna);
            })
        };
    });

    return horariosConReservaciones;
};

/**
 * Obtener resumen de reservaciones por día de la semana
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<Object>} Resumen agrupado por día de la semana
 */
const getResumenReservacionesPorSemana = async (fechaInicio, fechaFin) => {
    const sql = `
        SELECT 
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin,
            c.nombre_clase,
            r.fecha_reserva,
            COUNT(DISTINCT r.id) AS total_reservaciones,
            COUNT(DISTINCT CASE WHEN r.es_automatica = 1 THEN r.id END) AS reservaciones_automaticas,
            COUNT(DISTINCT CASE WHEN r.es_automatica = 0 OR r.es_automatica IS NULL THEN r.id END) AS reservaciones_manuales
        FROM horarios h
        INNER JOIN clases c ON h.clase_id = c.id
        LEFT JOIN reservaciones r ON r.horario_id = h.id 
            AND r.fecha_reserva BETWEEN ? AND ?
            AND r.estatus IN ('confirmada', 'completada')
        WHERE h.activo = TRUE AND c.activa = TRUE
        GROUP BY h.dia_semana, h.hora_inicio, h.hora_fin, c.nombre_clase, r.fecha_reserva
        ORDER BY 
            FIELD(h.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'),
            h.hora_inicio,
            r.fecha_reserva
    `;

    return await query(sql, [fechaInicio, fechaFin]);
};

module.exports = {
    getReservacionesPorDia,
    getResumenReservacionesPorSemana
};

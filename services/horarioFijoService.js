const { query, getConnection } = require('../config/database');
const { addDays, format, parseISO, isSameDay, startOfToday, isBefore } = require('date-fns');
const { CAPACIDAD_MAXIMA_CLASE } = require('../config/constants');

const diasSemanaMap = {
    'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 0
};
const diasSemanaInversoMap = {
    1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 0: 'domingo'
};

/**
 * Verificar si una alumna tiene plan mensual activo sin horarios fijos asignados
 * @param {number} alumnaId - ID de la alumna
 * @returns {Promise<Object>} { necesitaSeleccionar: boolean, pago: Object|null, horariosFijos: Array }
 */
const verificarNecesitaHorariosFijos = async (alumnaId) => {
    // Buscar pago mensual activo
    const pagosMensuales = await query(
        `SELECT id, tipo_plan, fecha_pago, fecha_vencimiento_plan, estatus
         FROM pagos 
         WHERE alumna_id = ? 
         AND tipo_plan = 'mensual'
         AND estatus = 'completado'
         AND (fecha_vencimiento_plan IS NULL OR fecha_vencimiento_plan >= CURDATE())
         ORDER BY fecha_creacion DESC
         LIMIT 1`,
        [alumnaId]
    );

    if (pagosMensuales.length === 0) {
        return {
            necesitaSeleccionar: false,
            pago: null,
            horariosFijos: []
        };
    }

    const pago = pagosMensuales[0];

    // Verificar si ya tiene horarios fijos activos para este pago
    const horariosFijos = await query(
        `SELECT id, horario_id, tipo_plan, fecha_inicio, fecha_fin
         FROM alumna_horarios_fijos
         WHERE alumna_id = ?
         AND pago_id = ?
         AND activo = TRUE
         AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())`,
        [alumnaId, pago.id]
    );

    return {
        necesitaSeleccionar: horariosFijos.length === 0,
        pago: pago,
        horariosFijos: horariosFijos
    };
};

/**
 * Crear horarios fijos para una alumna
 * @param {number} alumnaId - ID de la alumna
 * @param {number} pagoId - ID del pago
 * @param {string} tipoPlan - 'mensual' o 'semanal'
 * @param {Array<number>} horariosIds - Array de IDs de horarios (1 para semanal, 2 para mensual)
 * @param {Date} fechaInicio - Fecha de inicio del plan
 * @param {Date} fechaFin - Fecha de fin del plan
 * @returns {Promise<Array>} Horarios fijos creados
 */
const crearHorariosFijos = async (alumnaId, pagoId, tipoPlan, horariosIds, fechaInicio, fechaFin) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Validar cantidad de horarios según tipo de plan
        if (tipoPlan === 'semanal' && horariosIds.length !== 1) {
            throw new Error('El plan semanal requiere exactamente 1 horario');
        }
        if (tipoPlan === 'mensual' && horariosIds.length !== 2) {
            throw new Error('El plan mensual requiere exactamente 2 horarios');
        }

        // Validar que los horarios sean distintos
        if (tipoPlan === 'mensual' && horariosIds[0] === horariosIds[1]) {
            throw new Error('Los dos horarios del plan mensual deben ser diferentes');
        }

        // Validar que los horarios existan y estén activos
        const placeholders = horariosIds.map(() => '?').join(',');
        const horarios = await query(
            `SELECT h.id, h.dia_semana, h.hora_inicio, h.hora_fin, c.capacidad_maxima
             FROM horarios h
             INNER JOIN clases c ON h.clase_id = c.id
             WHERE h.id IN (${placeholders}) AND h.activo = TRUE AND c.activa = TRUE`,
            horariosIds
        );

        if (horarios.length !== horariosIds.length) {
            throw new Error('Uno o más horarios no son válidos o están inactivos');
        }

        // Validar que la alumna no tenga ya horarios fijos activos para estos horarios
        const horariosFijosExistentes = await query(
            `SELECT ahf.id, h.dia_semana, h.hora_inicio
             FROM alumna_horarios_fijos ahf
             INNER JOIN horarios h ON ahf.horario_id = h.id
             WHERE ahf.alumna_id = ? 
               AND ahf.activo = TRUE
               AND ahf.horario_id IN (${placeholders})`,
            [alumnaId, ...horariosIds]
        );

        if (horariosFijosExistentes.length > 0) {
            const horarioExistente = horariosFijosExistentes[0];
            throw new Error(`Ya tienes un horario fijo activo para ${horarioExistente.dia_semana} ${horarioExistente.hora_inicio}`);
        }

        // Validar cupos disponibles para el período completo
        const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
        const fechaFinStr = fechaFin.toISOString().split('T')[0];

        for (const horario of horarios) {
            const cuposDisponibles = await verificarCuposDisponibles(
                horario.id,
                horario.dia_semana,
                fechaInicioStr,
                fechaFinStr
            );

            if (!cuposDisponibles.disponible) {
                throw new Error(`El horario ${horario.dia_semana} ${horario.hora_inicio} no tiene cupos disponibles para el período completo`);
            }
        }

        // Crear registros de horarios fijos
        const horariosFijosCreados = [];
        for (const horarioId of horariosIds) {
            const resultado = await query(
                `INSERT INTO alumna_horarios_fijos 
                 (alumna_id, pago_id, horario_id, tipo_plan, fecha_inicio, fecha_fin, activo)
                 VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
                [alumnaId, pagoId, horarioId, tipoPlan, fechaInicioStr, fechaFinStr]
            );

            horariosFijosCreados.push(resultado.insertId);
        }

        // Generar reservaciones automáticas para todos los días del período
        await generarReservacionesAutomaticas(alumnaId, horariosIds, fechaInicioStr, fechaFinStr, horariosFijosCreados);

        await connection.commit();

        // Obtener los horarios fijos creados con información completa
        const horariosFijos = await query(
            `SELECT 
                ahf.id,
                ahf.horario_id,
                ahf.tipo_plan,
                ahf.fecha_inicio,
                ahf.fecha_fin,
                h.dia_semana,
                h.hora_inicio,
                h.hora_fin,
                c.nombre_clase
             FROM alumna_horarios_fijos ahf
             INNER JOIN horarios h ON ahf.horario_id = h.id
             INNER JOIN clases c ON h.clase_id = c.id
             WHERE ahf.id IN (${horariosFijosCreados.map(() => '?').join(',')})
             ORDER BY h.dia_semana, h.hora_inicio`,
            horariosFijosCreados
        );

        return horariosFijos;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Verifica los cupos disponibles para un horario específico en un rango de fechas.
 * Considera la capacidad máxima de la clase y las reservaciones existentes.
 * @param {number} horarioId - ID del horario
 * @param {string} diaSemana - Día de la semana del horario
 * @param {string} fechaInicioStr - Fecha de inicio del período (YYYY-MM-DD)
 * @param {string} fechaFinStr - Fecha de fin del período (YYYY-MM-DD)
 * @returns {Promise<Object>} { disponible: boolean, mensaje: string }
 */
const verificarCuposDisponibles = async (horarioId, diaSemana, fechaInicioStr, fechaFinStr) => {
    const capacidadMaxima = CAPACIDAD_MAXIMA_CLASE;

    // Obtener todas las fechas para el día de la semana dentro del rango
    const fechasClase = [];
    let currentDate = parseISO(fechaInicioStr);
    const endDate = parseISO(fechaFinStr);

    while (isBefore(currentDate, addDays(endDate, 1))) {
        if (diasSemanaInversoMap[currentDate.getDay()] === diaSemana) {
            fechasClase.push(format(currentDate, 'yyyy-MM-dd'));
        }
        currentDate = addDays(currentDate, 1);
    }

    if (fechasClase.length === 0) {
        return { disponible: true, mensaje: 'No hay días de clase en el período.' };
    }

    // Contar reservaciones existentes para cada fecha en el horario
    const placeholders = fechasClase.map(() => '?').join(',');
    const sql = `
        SELECT 
            fecha_reserva,
            COUNT(id) AS total_reservaciones
        FROM reservaciones
        WHERE horario_id = ? 
        AND fecha_reserva IN (${placeholders})
        AND estatus IN ('confirmada', 'completada')
        GROUP BY fecha_reserva
    `;
    const params = [horarioId, ...fechasClase];
    const resultados = await query(sql, params);

    for (const fecha of fechasClase) {
        const res = resultados.find(r => format(r.fecha_reserva, 'yyyy-MM-dd') === fecha);
        const reservacionesActuales = res ? res.total_reservaciones : 0;

        if (reservacionesActuales >= capacidadMaxima) {
            return { disponible: false, mensaje: `El horario ya está lleno para el ${fecha}` };
        }
    }

    return { disponible: true, mensaje: 'Cupos disponibles para todo el período.' };
};

/**
 * Genera reservaciones automáticas para una alumna en horarios fijos.
 * @param {number} alumnaId - ID de la alumna
 * @param {Array<number>} horariosIds - IDs de los horarios fijos
 * @param {string} fechaInicioStr - Fecha de inicio del plan (YYYY-MM-DD)
 * @param {string} fechaFinStr - Fecha de fin del plan (YYYY-MM-DD)
 * @param {Array<number>} horariosFijosCreadosIds - IDs de los registros en alumna_horarios_fijos
 */
const generarReservacionesAutomaticas = async (alumnaId, horariosIds, fechaInicioStr, fechaFinStr, horariosFijosCreadosIds) => {
    const connection = await getConnection();
    try {
        const horariosInfo = await query(
            `SELECT id, dia_semana FROM horarios WHERE id IN (${horariosIds.map(() => '?').join(',')})`,
            horariosIds
        );
        const horariosMap = new Map(horariosInfo.map(h => [h.id, h.dia_semana]));
        const horariosFijosMap = new Map(horariosIds.map((horarioId, index) => [horarioId, horariosFijosCreadosIds[index]]));

        let currentDate = parseISO(fechaInicioStr);
        const endDate = parseISO(fechaFinStr);
        const today = startOfToday();

        while (isBefore(currentDate, addDays(endDate, 1))) {
            if (isBefore(currentDate, today) && !isSameDay(currentDate, today)) {
                currentDate = addDays(currentDate, 1);
                continue;
            }

            const currentDayOfWeek = diasSemanaInversoMap[currentDate.getDay()];

            for (const horarioId of horariosIds) {
                if (horariosMap.get(horarioId) === currentDayOfWeek) {
                    const fechaReservaStr = format(currentDate, 'yyyy-MM-dd');
                    const horarioFijoId = horariosFijosMap.get(horarioId);

                    // Verificar si ya existe una reservación para evitar duplicados
                    const existingReservation = await query(
                        `SELECT id FROM reservaciones 
                         WHERE alumna_id = ? AND horario_id = ? AND fecha_reserva = ? 
                         AND estatus != 'cancelada'`,
                        [alumnaId, horarioId, fechaReservaStr]
                    );

                    if (existingReservation.length === 0) {
                        await query(
                            `INSERT INTO reservaciones (alumna_id, horario_id, fecha_reserva, estatus, es_automatica, horario_fijo_id)
                             VALUES (?, ?, ?, 'confirmada', TRUE, ?)`,
                            [alumnaId, horarioId, fechaReservaStr, horarioFijoId]
                        );
                    }
                }
            }
            currentDate = addDays(currentDate, 1);
        }
    } catch (error) {
        console.error('Error al generar reservaciones automáticas:', error);
        throw error;
    }
};

/**
 * Obtener horarios disponibles para asignación de horarios fijos.
 * Incluye información de cupos para el período.
 * @param {string} tipoPlan - 'mensual' o 'semanal'
 * @param {string} fechaInicioStr - Fecha de inicio del plan (YYYY-MM-DD)
 * @param {string} fechaFinStr - Fecha de fin del plan (YYYY-MM-DD)
 * @returns {Promise<Array>} Lista de horarios con disponibilidad
 */
const getHorariosDisponiblesParaFijos = async (tipoPlan, fechaInicioStr, fechaFinStr) => {
    const horarios = await query(
        `SELECT 
            h.id AS horario_id,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin,
            c.nombre_clase,
            c.descripcion,
            c.capacidad_maxima
        FROM horarios h
        INNER JOIN clases c ON h.clase_id = c.id
        WHERE h.activo = TRUE AND c.activa = TRUE
        ORDER BY FIELD(h.dia_semana, 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'), h.hora_inicio`
    );

    const horariosConDisponibilidad = [];
    for (const horario of horarios) {
        const disponibilidad = await verificarCuposDisponibles(
            horario.horario_id,
            horario.dia_semana,
            fechaInicioStr,
            fechaFinStr
        );
        horariosConDisponibilidad.push({
            ...horario,
            disponible_para_periodo: disponibilidad.disponible,
            mensaje_disponibilidad: disponibilidad.mensaje
        });
    }
    return horariosConDisponibilidad;
};

/**
 * Obtener los horarios fijos de una alumna
 * @param {number} alumnaId - ID de la alumna
 * @returns {Promise<Array>} Horarios fijos de la alumna
 */
const getMisHorariosFijos = async (alumnaId) => {
    const sql = `
        SELECT 
            ahf.id,
            ahf.horario_id,
            ahf.tipo_plan,
            ahf.fecha_inicio,
            ahf.fecha_fin,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin,
            c.nombre_clase
        FROM alumna_horarios_fijos ahf
        INNER JOIN horarios h ON ahf.horario_id = h.id
        INNER JOIN clases c ON h.clase_id = c.id
        WHERE ahf.alumna_id = ? AND ahf.activo = TRUE
        ORDER BY ahf.fecha_inicio DESC, h.dia_semana, h.hora_inicio;
    `;
    return await query(sql, [alumnaId]);
};

/**
 * Obtener horarios disponibles para selección (con validación de cupos)
 * @param {string} tipoPlan - 'mensual' o 'semanal'
 * @param {Date} fechaInicio - Fecha de inicio del plan
 * @param {Date} fechaFin - Fecha de fin del plan
 * @returns {Promise<Array>} Horarios disponibles con información de cupos
 */
const getHorariosDisponiblesParaPlan = async (tipoPlan, fechaInicio, fechaFin) => {
    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = fechaFin.toISOString().split('T')[0];

    // Obtener todos los horarios activos
    const horarios = await query(
        `SELECT 
            h.id,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin,
            c.nombre_clase,
            c.capacidad_maxima
         FROM horarios h
         INNER JOIN clases c ON h.clase_id = c.id
         WHERE h.activo = TRUE AND c.activa = TRUE
         ORDER BY h.dia_semana, h.hora_inicio`
    );

    // Verificar cupos para cada horario
    const horariosConCupos = await Promise.all(
        horarios.map(async (horario) => {
            const cupos = await verificarCuposDisponibles(
                horario.id,
                horario.dia_semana,
                fechaInicioStr,
                fechaFinStr
            );

            return {
                ...horario,
                disponible: cupos.disponible,
                motivo: cupos.motivo || null,
                capacidad: cupos.capacidad || horario.capacidad_maxima
            };
        })
    );

    return horariosConCupos;
};

module.exports = {
    verificarNecesitaHorariosFijos,
    crearHorariosFijos,
    verificarCuposDisponibles,
    generarReservacionesAutomaticas,
    getHorariosDisponiblesParaFijos,
    getMisHorariosFijos,
    getHorariosDisponiblesParaPlan
};

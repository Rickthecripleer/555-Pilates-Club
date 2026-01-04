const { query, getConnection } = require('../config/database');
const claseService = require('./claseService');

/**
 * Verificar si la alumna tiene acceso para reservar
 * (solo verifica si tiene plan activo - mensual o semanal)
 * @param {number} alumnaId - ID de la alumna
 * @returns {Promise<Object>} Información de acceso
 */
const verificarAccesoReservacion = async (alumnaId) => {
    // Verificar si el usuario existe y está activo
    const usuarios = await query(
        'SELECT id FROM usuarios WHERE id = ? AND activo = TRUE',
        [alumnaId]
    );

    if (usuarios.length === 0) {
        return { tieneAcceso: false, motivo: 'Usuario no encontrado o inactivo' };
    }

    // Verificar si tiene plan activo (mensual, semanal, o paquetes semanales)
    // Los paquetes de 2, 3, 4 clases semanales ($180, $280, $380) también permiten reservar
    const pagosActivos = await query(
        `SELECT id, tipo_plan, fecha_vencimiento_plan, monto
         FROM pagos 
         WHERE alumna_id = ? 
            AND estatus = 'completado' 
            AND (
                (tipo_plan IN ('mensual', 'semanal') 
                    AND (fecha_vencimiento_plan IS NULL OR fecha_vencimiento_plan >= CURDATE()))
                OR
                (tipo_plan = 'paquete' 
                    AND monto IN (180, 280, 380)
                    AND (fecha_vencimiento_plan IS NULL OR fecha_vencimiento_plan >= CURDATE()))
            )
         ORDER BY fecha_creacion DESC 
         LIMIT 1`,
        [alumnaId]
    );

    const tienePlanActivo = pagosActivos.length > 0;

    // Tiene acceso si tiene plan activo (mensual o semanal)
    const tieneAcceso = tienePlanActivo;

    return {
        tieneAcceso,
        tienePlanActivo,
        tipoPlan: tienePlanActivo ? pagosActivos[0].tipo_plan : null,
        motivo: tieneAcceso 
            ? 'Acceso permitido' 
            : 'No tienes un plan activo. Realiza un pago para activar tu plan.'
    };
};

/**
 * Crear una nueva reservación
 * @param {number} alumnaId - ID de la alumna
 * @param {number} horarioId - ID del horario
 * @param {Date} fechaReserva - Fecha de la reservación
 * @returns {Promise<Object>} Reservación creada
 */
const crearReservacion = async (alumnaId, horarioId, fechaReserva) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Verificar acceso de la alumna
        const acceso = await verificarAccesoReservacion(alumnaId);
        if (!acceso.tieneAcceso) {
            throw new Error(acceso.motivo);
        }

        // 2. Verificar que el horario existe y está activo (sin límite de lugares)
        const horarios = await query(
            'SELECT h.id FROM horarios h INNER JOIN clases c ON h.clase_id = c.id WHERE h.id = ? AND h.activo = TRUE AND c.activa = TRUE',
            [horarioId]
        );
        
        if (horarios.length === 0) {
            throw new Error('Horario no encontrado o inactivo');
        }

        // 3. Verificar que no tenga ya una reservación para ese horario y fecha
        const reservacionesExistentes = await query(
            `SELECT id FROM reservaciones 
             WHERE alumna_id = ? AND horario_id = ? AND fecha_reserva = ? 
             AND estatus != 'cancelada'`,
            [alumnaId, horarioId, fechaReserva.toISOString().split('T')[0]]
        );

        if (reservacionesExistentes.length > 0) {
            throw new Error('Ya tienes una reservación para este horario y fecha');
        }

        // 4. Crear la reservación
        const fechaFormateada = fechaReserva.toISOString().split('T')[0];
        const resultado = await query(
            `INSERT INTO reservaciones (alumna_id, horario_id, fecha_reserva, estatus) 
             VALUES (?, ?, ?, 'confirmada')`,
            [alumnaId, horarioId, fechaFormateada]
        );

        // 5. No se descuentan créditos - el sistema solo verifica planes activos

        await connection.commit();

        // Obtener la reservación creada con información completa
        const reservacion = await query(
            `SELECT 
                r.id,
                r.alumna_id,
                r.horario_id,
                r.fecha_reserva,
                r.estatus,
                r.fecha_creacion,
                c.nombre_clase,
                h.dia_semana,
                h.hora_inicio,
                h.hora_fin
             FROM reservaciones r
             INNER JOIN horarios h ON r.horario_id = h.id
             INNER JOIN clases c ON h.clase_id = c.id
             WHERE r.id = ?`,
            [resultado.insertId]
        );

        return reservacion[0];
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Obtener reservaciones de una alumna
 * @param {number} alumnaId - ID de la alumna
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de reservaciones
 */
const getReservacionesAlumna = async (alumnaId, filters = {}) => {
    let sql = `
        SELECT 
            r.id,
            r.horario_id,
            r.fecha_reserva,
            r.estatus,
            r.fecha_creacion,
            c.nombre_clase,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin
        FROM reservaciones r
        INNER JOIN horarios h ON r.horario_id = h.id
        INNER JOIN clases c ON h.clase_id = c.id
        WHERE r.alumna_id = ?
    `;

    const params = [alumnaId];

    if (filters.estatus) {
        sql += ' AND r.estatus = ?';
        params.push(filters.estatus);
    }

    if (filters.fecha_desde) {
        sql += ' AND r.fecha_reserva >= ?';
        params.push(filters.fecha_desde);
    }

    if (filters.fecha_hasta) {
        sql += ' AND r.fecha_reserva <= ?';
        params.push(filters.fecha_hasta);
    }

    sql += ' ORDER BY r.fecha_reserva DESC, h.hora_inicio DESC';

    return await query(sql, params);
};

/**
 * Crear una reservación por administrador (sin verificar acceso)
 * @param {number} alumnaId - ID de la alumna
 * @param {number} horarioId - ID del horario
 * @param {Date} fechaReserva - Fecha de la reservación
 * @returns {Promise<Object>} Reservación creada
 */
const crearReservacionAdmin = async (alumnaId, horarioId, fechaReserva) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Verificar que la alumna existe
        const usuarios = await query(
            'SELECT id FROM usuarios WHERE id = ? AND rol = ?',
            [alumnaId, 'alumna']
        );
        
        if (usuarios.length === 0) {
            throw new Error('Alumna no encontrada');
        }

        // 2. Verificar que el horario existe y está activo
        const horarios = await query(
            'SELECT h.id FROM horarios h INNER JOIN clases c ON h.clase_id = c.id WHERE h.id = ? AND h.activo = TRUE AND c.activa = TRUE',
            [horarioId]
        );
        
        if (horarios.length === 0) {
            throw new Error('Horario no encontrado o inactivo');
        }

        // 3. Validar que la fecha no sea en el pasado (a menos que sea hoy)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaReservaNormalizada = new Date(fechaReserva);
        fechaReservaNormalizada.setHours(0, 0, 0, 0);
        
        if (fechaReservaNormalizada < hoy) {
            throw new Error('No se pueden crear reservaciones para fechas pasadas');
        }

        // 4. Verificar que no tenga ya una reservación para ese horario y fecha
        const reservacionesExistentes = await query(
            `SELECT id FROM reservaciones 
             WHERE alumna_id = ? AND horario_id = ? AND fecha_reserva = ? 
             AND estatus != 'cancelada'`,
            [alumnaId, horarioId, fechaReserva.toISOString().split('T')[0]]
        );

        if (reservacionesExistentes.length > 0) {
            throw new Error('La alumna ya tiene una reservación para este horario y fecha');
        }

        // 5. Crear la reservación (sin verificar acceso - el admin puede asignar directamente)
        const fechaFormateada = fechaReserva.toISOString().split('T')[0];
        const resultado = await query(
            `INSERT INTO reservaciones (alumna_id, horario_id, fecha_reserva, estatus) 
             VALUES (?, ?, ?, 'confirmada')`,
            [alumnaId, horarioId, fechaFormateada]
        );

        await connection.commit();

        // Obtener la reservación creada con información completa
        const reservacion = await query(
            `SELECT 
                r.id,
                r.alumna_id,
                r.horario_id,
                r.fecha_reserva,
                r.estatus,
                r.fecha_creacion,
                c.nombre_clase,
                h.dia_semana,
                h.hora_inicio,
                h.hora_fin
             FROM reservaciones r
             INNER JOIN horarios h ON r.horario_id = h.id
             INNER JOIN clases c ON h.clase_id = c.id
             WHERE r.id = ?`,
            [resultado.insertId]
        );

        return reservacion[0];
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Cancelar una reservación
 * @param {number} alumnaId - ID de la alumna
 * @param {number} reservacionId - ID de la reservación
 * @returns {Promise<Object>} Reservación cancelada
 */
const cancelarReservacion = async (alumnaId, reservacionId) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Verificar que la reservación existe y pertenece a la alumna
        const reservaciones = await query(
            `SELECT r.*, h.horario_id, p.tipo_plan, p.id as pago_id
             FROM reservaciones r
             INNER JOIN horarios h ON r.horario_id = h.id
             LEFT JOIN pagos p ON p.alumna_id = r.alumna_id 
                AND p.tipo_plan = 'mensual' 
                AND p.estatus = 'completado'
                AND (p.fecha_vencimiento_plan IS NULL OR p.fecha_vencimiento_plan >= CURDATE())
             WHERE r.id = ? AND r.alumna_id = ? AND r.estatus = 'confirmada'`,
            [reservacionId, alumnaId]
        );

        if (reservaciones.length === 0) {
            throw new Error('Reservación no encontrada o ya fue cancelada');
        }

        const reservacion = reservaciones[0];

        // Verificar que la fecha no sea en el pasado (solo se pueden cancelar reservaciones futuras)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaReserva = new Date(reservacion.fecha_reserva);
        fechaReserva.setHours(0, 0, 0, 0);

        if (fechaReserva < hoy) {
            throw new Error('No se pueden cancelar reservaciones de fechas pasadas');
        }

        // Cancelar la reservación
        await query(
            'UPDATE reservaciones SET estatus = "cancelada" WHERE id = ?',
            [reservacionId]
        );

        await connection.commit();

        // Obtener la reservación cancelada con información completa
        const reservacionCancelada = await query(
            `SELECT 
                r.id,
                r.alumna_id,
                r.horario_id,
                r.fecha_reserva,
                r.estatus,
                c.nombre_clase,
                h.dia_semana,
                h.hora_inicio,
                h.hora_fin
             FROM reservaciones r
             INNER JOIN horarios h ON r.horario_id = h.id
             INNER JOIN clases c ON h.clase_id = c.id
             WHERE r.id = ?`,
            [reservacionId]
        );

        return reservacionCancelada[0];
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    verificarAccesoReservacion,
    crearReservacion,
    crearReservacionAdmin,
    getReservacionesAlumna,
    cancelarReservacion
};






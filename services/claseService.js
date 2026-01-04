const { query } = require('../config/database');

/**
 * Obtener todas las clases activas con sus horarios
 * @param {Object} filters - Filtros opcionales (dia_semana, hora_inicio, hora_fin)
 * @returns {Promise<Array>} Lista de clases con horarios
 */
const getClasesDisponibles = async (filters = {}) => {
    let sql = `
        SELECT 
            c.id AS clase_id,
            c.nombre_clase,
            c.descripcion,
            c.capacidad_maxima,
            h.id AS horario_id,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin,
            COUNT(DISTINCT r.id) AS reservaciones_actuales,
            (c.capacidad_maxima - COUNT(DISTINCT r.id)) AS lugares_disponibles
        FROM clases c
        INNER JOIN horarios h ON c.id = h.clase_id
        LEFT JOIN reservaciones r ON h.id = r.horario_id 
            AND r.fecha_reserva = CURDATE()
            AND r.estatus IN ('confirmada', 'completada')
        WHERE c.activa = TRUE 
            AND h.activo = TRUE
    `;

    const params = [];

    // Aplicar filtros
    if (filters.dia_semana) {
        sql += ' AND h.dia_semana = ?';
        params.push(filters.dia_semana);
    }

    if (filters.hora_inicio) {
        sql += ' AND h.hora_inicio >= ?';
        params.push(filters.hora_inicio);
    }

    if (filters.hora_fin) {
        sql += ' AND h.hora_fin <= ?';
        params.push(filters.hora_fin);
    }

    // Agrupar por clase y horario
    // NOTA: Removido HAVING lugares_disponibles > 0 para mostrar todas las clases
    // El frontend manejará la deshabilitación si no hay lugares disponibles
    sql += `
        GROUP BY c.id, h.id
        ORDER BY h.dia_semana, h.hora_inicio, c.nombre_clase
    `;

    const resultados = await query(sql, params);
    return resultados;
};

/**
 * Obtener clases disponibles para una fecha específica
 * @param {Date} fecha - Fecha para la cual se buscan clases
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de clases con horarios disponibles
 */
const getClasesDisponiblesPorFecha = async (fecha, filters = {}) => {
    // Asegurar que la fecha se interprete correctamente en hora local
    // Si la fecha viene como string, convertirla a Date
    let fechaObj = fecha;
    if (typeof fecha === 'string') {
        // Parsear la fecha en formato YYYY-MM-DD como fecha local (no UTC)
        const [year, month, day] = fecha.split('-').map(Number);
        fechaObj = new Date(year, month - 1, day);
    }
    
    // Obtener el día de la semana de la fecha (0 = domingo, 1 = lunes, etc.)
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[fechaObj.getDay()];

    // Solo permitir clases de lunes a viernes
    const diasPermitidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    if (!diasPermitidos.includes(diaSemana)) {
        // Retornar array vacío si es sábado o domingo
        return [];
    }

    // Solo permitir las 3 clases especificadas
    const clasesPermitidas = ['Pilates Mat', 'Pilates Sculpt', 'Pilates HIIT'];

    let sql = `
        SELECT 
            c.id AS clase_id,
            c.nombre_clase,
            c.descripcion,
            c.capacidad_maxima,
            h.id AS horario_id,
            h.dia_semana,
            h.hora_inicio,
            h.hora_fin,
            COUNT(DISTINCT r.id) AS reservaciones_actuales,
            (c.capacidad_maxima - COUNT(DISTINCT r.id)) AS lugares_disponibles
        FROM clases c
        INNER JOIN horarios h ON c.id = h.clase_id
        LEFT JOIN reservaciones r ON h.id = r.horario_id 
            AND r.fecha_reserva = ?
            AND r.estatus IN ('confirmada', 'completada')
        WHERE c.activa = TRUE 
            AND h.activo = TRUE
            AND h.dia_semana = ?
            AND c.nombre_clase IN (?, ?, ?)
    `;

    // Formatear la fecha para la consulta SQL (YYYY-MM-DD)
    const fechaFormateada = fechaObj.getFullYear() + '-' + 
                           String(fechaObj.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(fechaObj.getDate()).padStart(2, '0');
    
    const params = [fechaFormateada, diaSemana, ...clasesPermitidas];

    // Aplicar filtros adicionales
    if (filters.hora_inicio) {
        sql += ' AND h.hora_inicio >= ?';
        params.push(filters.hora_inicio);
    }

    if (filters.hora_fin) {
        sql += ' AND h.hora_fin <= ?';
        params.push(filters.hora_fin);
    }

    sql += `
        GROUP BY c.id, h.id
        ORDER BY h.hora_inicio, c.nombre_clase
    `;

    const resultados = await query(sql, params);
    
    // Asegurar que siempre se muestren todas las clases, incluso si están llenas
    // El frontend manejará la deshabilitación del botón si no hay lugares
    return resultados;
};

/**
 * Verificar si el horario está activo (sin límite de lugares)
 * @param {number} horarioId - ID del horario
 * @param {Date} fecha - Fecha de la reservación
 * @returns {Promise<Object>} Información de disponibilidad
 */
const verificarDisponibilidad = async (horarioId, fecha) => {
    const sql = `
        SELECT 
            h.id,
            c.capacidad_maxima,
            COUNT(DISTINCT r.id) AS reservaciones_actuales
        FROM horarios h
        INNER JOIN clases c ON h.clase_id = c.id
        LEFT JOIN reservaciones r ON h.id = r.horario_id 
            AND r.fecha_reserva = ?
            AND r.estatus IN ('confirmada', 'completada')
        WHERE h.id = ? AND h.activo = TRUE AND c.activa = TRUE
        GROUP BY c.id, h.id
    `;

    const resultados = await query(sql, [fecha.toISOString().split('T')[0], horarioId]);
    
    if (resultados.length === 0) {
        return { disponible: false, lugares: 0, mensaje: 'Horario no encontrado o inactivo' };
    }

    const disponibilidad = resultados[0];
    // Sin límite de lugares - siempre disponible si el horario está activo
    return {
        disponible: true,
        lugares: 999, // Sin límite
        capacidad: disponibilidad.capacidad_maxima,
        reservadas: disponibilidad.reservaciones_actuales
    };
};

module.exports = {
    getClasesDisponibles,
    getClasesDisponiblesPorFecha,
    verificarDisponibilidad
};






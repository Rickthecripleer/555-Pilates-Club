const { query, getConnection } = require('../config/database');
const path = require('path');
const { COSTO_INSCRIPCION } = require('../config/constants');

/**
 * Calcular fecha de vencimiento según el tipo de plan
 * @param {Date} fechaPago - Fecha del pago
 * @param {string} tipoPlan - Tipo de plan (mensual, semanal, sesion, paquete)
 * @param {number} cantidadSesiones - Cantidad de sesiones (para paquetes)
 * @returns {Date} Fecha de vencimiento
 */
const calcularFechaVencimiento = (fechaPago, tipoPlan, cantidadSesiones = null, monto = null) => {
    const fecha = new Date(fechaPago);
    
    switch (tipoPlan) {
        case 'mensual':
            fecha.setMonth(fecha.getMonth() + 1);
            break;
        case 'semanal':
            fecha.setDate(fecha.getDate() + 7);
            break;
        case 'sesion':
            // Sesión individual vence en 90 días
            fecha.setDate(fecha.getDate() + 90);
            break;
        case 'paquete':
            // Si el monto corresponde a planes semanales (2, 3, 4 clases), vence en 7 días
            if (monto && (monto === 180 || monto === 280 || monto === 380)) {
                fecha.setDate(fecha.getDate() + 7);
            } else {
                // Paquete normal: 30 días por cada 5 sesiones (ajustar según política)
                const dias = cantidadSesiones ? Math.ceil(cantidadSesiones / 5) * 30 : 90;
                fecha.setDate(fecha.getDate() + dias);
            }
            break;
        case 'inscripcion':
            // La inscripción no tiene vencimiento (pago único)
            // Retornar null para indicar que no vence
            return null;
        default:
            fecha.setDate(fecha.getDate() + 30);
    }
    
    return fecha;
};

// Función eliminada - el sistema ya no usa créditos, solo planes activos

/**
 * Crear registro de pago con comprobante
 * @param {number} alumnaId - ID de la alumna
 * @param {Object} datosPago - Datos del pago
 * @param {string} comprobanteUrl - URL del comprobante
 * @param {string} estatusInicial - Estatus inicial del pago (default: 'pendiente')
 * @returns {Promise<Object>} Pago creado
 */
const crearPago = async (alumnaId, datosPago, comprobanteUrl, estatusInicial = 'pendiente') => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Calcular fecha de vencimiento
        const fechaVencimiento = calcularFechaVencimiento(
            new Date(datosPago.fecha_pago),
            datosPago.tipo_plan,
            datosPago.cantidad_sesiones,
            parseFloat(datosPago.monto)
        );

        // Crear registro de pago con estatus inicial especificado
        const fechaFormateada = new Date(datosPago.fecha_pago).toISOString().split('T')[0];
        const resultado = await query(
            `INSERT INTO pagos 
                (alumna_id, monto, fecha_pago, metodo_pago, tipo_plan, estatus, comprobante_url, fecha_vencimiento_plan, descripcion, horarios_seleccionados)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                alumnaId,
                datosPago.monto,
                fechaFormateada,
                datosPago.metodo_pago,
                datosPago.tipo_plan,
                estatusInicial,
                comprobanteUrl,
                fechaVencimiento ? fechaVencimiento.toISOString().split('T')[0] : null,
                datosPago.descripcion || null,
                datosPago.horarios_seleccionados || null
            ]
        );

        await connection.commit();

        // Obtener el pago creado
        const pagos = await query(
            'SELECT * FROM pagos WHERE id = ?',
            [resultado.insertId]
        );

        return pagos[0];
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Validar pago (solo admin puede hacerlo)
 * Esto activa los créditos o el plan de la alumna
 * @param {number} pagoId - ID del pago
 * @param {boolean} aprobar - true para aprobar, false para rechazar
 * @returns {Promise<Object>} Pago actualizado
 */
const validarPago = async (pagoId, aprobar) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Obtener información del pago
        const pagos = await query(
            'SELECT * FROM pagos WHERE id = ?',
            [pagoId]
        );

        if (pagos.length === 0) {
            throw new Error('Pago no encontrado');
        }

        const pago = pagos[0];

        if (pago.estatus !== 'pendiente') {
            throw new Error('El pago ya fue procesado');
        }

        if (aprobar) {
            // Actualizar estatus a completado
            await query(
                'UPDATE pagos SET estatus = "completado" WHERE id = ?',
                [pagoId]
            );

            // Si el pago tiene horarios fijos asignados, crear las reservaciones automáticas
            // Esto se maneja desde el controlador que llama a este servicio
            // porque necesita los horarios seleccionados por la alumna o admin

            // No se calculan créditos - el sistema funciona solo con planes activos
            // Los planes mensuales/semanales/paquetes semanales se activan automáticamente al aprobar
        } else {
            // Rechazar pago
            await query(
                'UPDATE pagos SET estatus = "cancelado" WHERE id = ?',
                [pagoId]
            );
        }

        await connection.commit();

        // Obtener el pago actualizado
        const pagosActualizados = await query(
            'SELECT * FROM pagos WHERE id = ?',
            [pagoId]
        );

        return pagosActualizados[0];
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Crear pago completado directamente (para pagos en efectivo registrados por admin)
 * @param {number} alumnaId - ID de la alumna
 * @param {Object} datosPago - Datos del pago
 * @returns {Promise<Object>} Pago creado
 */
const crearPagoCompletado = async (alumnaId, datosPago) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // NUEVA REGLA: Si el plan es 'Mensualidad' y no tiene inscripción, agregar costo de inscripción
        let montoFinal = parseFloat(datosPago.monto);
        let descripcionFinal = datosPago.descripcion || '';
        
        if (datosPago.tipo_plan === 'mensual') {
            const tieneInscripcion = await tieneInscripcionPagada(alumnaId);
            if (!tieneInscripcion) {
                montoFinal = parseFloat(datosPago.monto) + COSTO_INSCRIPCION;
                const descripcionBase = datosPago.descripcion || 'Mensualidad';
                descripcionFinal = `${descripcionBase} (Mensualidad: $${parseFloat(datosPago.monto).toFixed(2)} + Inscripción: $${COSTO_INSCRIPCION.toFixed(2)})`;
            }
        }

        // NUEVA REGLA: Efectivo se marca automáticamente como 'completado'
        // Otros métodos quedan como 'pendiente'
        const estatusInicial = datosPago.metodo_pago === 'efectivo' ? 'completado' : 'pendiente';

        // Calcular fecha de vencimiento
        const fechaVencimiento = calcularFechaVencimiento(
            new Date(datosPago.fecha_pago),
            datosPago.tipo_plan,
            null,
            montoFinal
        );

        // Crear registro de pago con estatus según método de pago
        const fechaFormateada = new Date(datosPago.fecha_pago).toISOString().split('T')[0];
        
        // Preparar horarios seleccionados si vienen en datosPago
        let horariosSeleccionadosJson = null;
        if (datosPago.horarios_seleccionados) {
            if (Array.isArray(datosPago.horarios_seleccionados)) {
                horariosSeleccionadosJson = JSON.stringify(datosPago.horarios_seleccionados);
            } else if (typeof datosPago.horarios_seleccionados === 'string') {
                horariosSeleccionadosJson = datosPago.horarios_seleccionados;
            }
        }
        
        const resultado = await query(
            `INSERT INTO pagos 
                (alumna_id, monto, fecha_pago, metodo_pago, tipo_plan, estatus, fecha_vencimiento_plan, descripcion, horarios_seleccionados)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                alumnaId,
                montoFinal,
                fechaFormateada,
                datosPago.metodo_pago,
                datosPago.tipo_plan,
                estatusInicial,
                fechaVencimiento ? fechaVencimiento.toISOString().split('T')[0] : null,
                descripcionFinal || null,
                horariosSeleccionadosJson
            ]
        );

        // No se calculan créditos porque el sistema ya no los usa
        // Los planes mensuales/semanales se activan automáticamente

        await connection.commit();

        // Obtener el pago creado
        const pagos = await query(
            'SELECT * FROM pagos WHERE id = ?',
            [resultado.insertId]
        );

        return pagos[0];
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Verificar si la alumna tiene inscripción pagada
 * @param {number} alumnaId - ID de la alumna
 * @returns {Promise<boolean>} true si tiene inscripción pagada
 */
const tieneInscripcionPagada = async (alumnaId) => {
    // REGLA FUNDAMENTAL: La inscripción solo se cobra UNA VEZ en toda la vida de la alumna
    
    // 1. Verificar si tiene un pago de inscripción directa completado
    const pagosInscripcionCompletados = await query(
        `SELECT id FROM pagos 
         WHERE alumna_id = ? 
            AND tipo_plan = 'inscripcion' 
            AND estatus = 'completado'`,
        [alumnaId]
    );
    
    if (pagosInscripcionCompletados.length > 0) {
        return true; // Ya pagó inscripción directamente
    }
    
    // 2. Verificar si tiene un pago de mensualidad COMPLETADO que incluya inscripción
    // Solo considerar pagos completados para evitar problemas si un pago pendiente se rechaza
    const pagosMensualidadConInscripcion = await query(
        `SELECT id FROM pagos 
         WHERE alumna_id = ? 
            AND tipo_plan = 'mensual' 
            AND estatus = 'completado'
            AND (descripcion LIKE '%Inscripción%' OR descripcion LIKE '%Inscripcion%' OR monto >= ?)`,
        [alumnaId, 1100] // Monto mínimo que incluiría mensualidad (980) + inscripción (120)
    );
    
    if (pagosMensualidadConInscripcion.length > 0) {
        return true; // Ya pagó inscripción dentro de una mensualidad anterior
    }
    
    // 3. También verificar pagos pendientes que incluyan inscripción
    // Esto evita cobrar doble inscripción si ya hay un pago pendiente con inscripción
    const pagosPendientesConInscripcion = await query(
        `SELECT id FROM pagos 
         WHERE alumna_id = ? 
            AND tipo_plan = 'mensual' 
            AND estatus = 'pendiente'
            AND (descripcion LIKE '%Inscripción%' OR descripcion LIKE '%Inscripcion%' OR monto >= ?)`,
        [alumnaId, 1100]
    );
    
    return pagosPendientesConInscripcion.length > 0;
};

/**
 * Obtener pagos de una alumna
 * @param {number} alumnaId - ID de la alumna
 * @returns {Promise<Array>} Lista de pagos
 */
const getPagosAlumna = async (alumnaId) => {
    return await query(
        `SELECT 
            id,
            monto,
            fecha_pago,
            metodo_pago,
            tipo_plan,
            estatus,
            comprobante_url,
            fecha_vencimiento_plan,
            descripcion,
            fecha_creacion
         FROM pagos 
         WHERE alumna_id = ? 
         ORDER BY fecha_creacion DESC`,
        [alumnaId]
    );
};

module.exports = {
    crearPago,
    crearPagoCompletado,
    validarPago,
    getPagosAlumna,
    calcularFechaVencimiento,
    tieneInscripcionPagada
};


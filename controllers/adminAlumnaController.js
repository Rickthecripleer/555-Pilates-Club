const { query, getConnection } = require('../config/database');
const pagoService = require('../services/pagoService');

/**
 * GET /api/admin/alumnas
 * Obtener todas las alumnas
 */
const getAlumnas = async (req, res) => {
    try {
        const alumnas = await query(
            `SELECT 
                id, 
                nombre, 
                email, 
                telefono, 
                fecha_registro, 
                activo
             FROM usuarios 
             WHERE rol = 'alumna'
             ORDER BY fecha_registro DESC`
        );

        res.json({
            success: true,
            data: alumnas
        });
    } catch (error) {
        console.error('Error al obtener alumnas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener alumnas',
            error: error.message
        });
    }
};

/**
 * GET /api/admin/alumnas/:id
 * Obtener información detallada de una alumna
 */
const getAlumna = async (req, res) => {
    try {
        const { id } = req.params;

        const alumnas = await query(
            `SELECT 
                id, 
                nombre, 
                email, 
                telefono, 
                fecha_registro, 
                activo
             FROM usuarios 
             WHERE id = ? AND rol = 'alumna'`,
            [id]
        );

        if (alumnas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Alumna no encontrada'
            });
        }

        // Obtener pagos de la alumna
        const pagos = await query(
            `SELECT * FROM pagos WHERE alumna_id = ? ORDER BY fecha_creacion DESC`,
            [id]
        );

        // Obtener reservaciones de la alumna
        const reservaciones = await query(
            `SELECT 
                r.*,
                c.nombre_clase,
                h.dia_semana,
                h.hora_inicio,
                h.hora_fin
             FROM reservaciones r
             INNER JOIN horarios h ON r.horario_id = h.id
             INNER JOIN clases c ON h.clase_id = c.id
             WHERE r.alumna_id = ?
             ORDER BY r.fecha_reserva DESC
             LIMIT 10`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...alumnas[0],
                pagos,
                reservaciones
            }
        });
    } catch (error) {
        console.error('Error al obtener alumna:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener alumna',
            error: error.message
        });
    }
};

/**
 * POST /api/admin/alumnas/registro-rapido
 * Registrar una alumna rápidamente (solo nombre, para excepciones)
 */
const registrarAlumnaRapida = async (req, res) => {
    try {
        const { nombre, telefono, tipo_plan, monto, fecha_pago, descripcion } = req.body;

        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido'
            });
        }

        // Generar email y password automáticos
        // Limitar la longitud del nombre base para evitar emails muy largos
        const emailBase = nombre.toLowerCase()
            .replace(/\s+/g, '.')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 30); // Limitar a 30 caracteres máximo
        const timestamp = Date.now();
        const email = `${emailBase}.${timestamp}@pilates.local`;
        
        // Password simple pero seguro (se puede cambiar después)
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('pilates123', 10);

        // Crear usuario
        const resultadoUsuario = await query(
            `INSERT INTO usuarios (email, password, rol, nombre, telefono, activo)
             VALUES (?, ?, 'alumna', ?, ?, TRUE)`,
            [email, passwordHash, nombre, telefono || null]
        );

        const alumnaId = resultadoUsuario.insertId;

        // Si se proporcionó información de pago, registrarlo también
        let pago = null;
        if (tipo_plan && monto) {
            const datosPago = {
                monto: parseFloat(monto),
                fecha_pago: fecha_pago || new Date().toISOString().split('T')[0],
                metodo_pago: 'efectivo',
                tipo_plan: tipo_plan,
                descripcion: descripcion || 'Pago en efectivo registrado al crear alumna'
            };
            pago = await pagoService.crearPagoCompletado(alumnaId, datosPago);
        }

        // Obtener la alumna creada
        const alumnas = await query(
            'SELECT id, nombre, email, telefono FROM usuarios WHERE id = ?',
            [alumnaId]
        );

        res.status(201).json({
            success: true,
            message: 'Alumna registrada exitosamente',
            data: {
                alumna: alumnas[0],
                pago: pago,
                credenciales: {
                    email: email,
                    password: 'pilates123' // Solo para mostrar, no se guarda en texto plano
                }
            }
        });
    } catch (error) {
        console.error('Error al registrar alumna rápida:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar alumna',
            error: error.message
        });
    }
};

/**
 * POST /api/admin/alumnas/:id/pago-efectivo
 * Registrar un pago en efectivo para una alumna
 */
const registrarPagoEfectivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto, fecha_pago, tipo_plan, descripcion, horarios_seleccionados } = req.body;

        // Validar que la alumna existe
        const alumnas = await query(
            'SELECT id FROM usuarios WHERE id = ? AND rol = ?',
            [id, 'alumna']
        );

        if (alumnas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Alumna no encontrada'
            });
        }

        // Validar horarios si es plan mensual o semanal
        if ((tipo_plan === 'mensual' || tipo_plan === 'semanal')) {
            if (!horarios_seleccionados || !Array.isArray(horarios_seleccionados)) {
                return res.status(400).json({
                    success: false,
                    message: 'Los horarios seleccionados son requeridos para planes mensuales o semanales'
                });
            }

            if (tipo_plan === 'semanal' && horarios_seleccionados.length !== 1) {
                return res.status(400).json({
                    success: false,
                    message: 'El plan semanal requiere exactamente 1 horario'
                });
            }

            if (tipo_plan === 'mensual' && horarios_seleccionados.length !== 2) {
                return res.status(400).json({
                    success: false,
                    message: 'El plan mensual requiere exactamente 2 horarios'
                });
            }
        }

        // NUEVA REGLA: La inscripción se aplica solo si el plan es 'Mensualidad' (ver config/constants.js para el costo)
        // Para otros planes, no se requiere inscripción
        // El cálculo se hace dentro de crearPagoCompletado

        // Preparar horarios seleccionados
        let horariosSeleccionadosArray = [];
        if (horarios_seleccionados && Array.isArray(horarios_seleccionados)) {
            horariosSeleccionadosArray = horarios_seleccionados.map(h => parseInt(h));
        }

        // Crear el pago directamente (efectivo se marca como completado automáticamente)
        const datosPago = {
            monto: parseFloat(monto),
            fecha_pago: fecha_pago || new Date().toISOString().split('T')[0],
            metodo_pago: 'efectivo',
            tipo_plan: tipo_plan,
            descripcion: descripcion || 'Pago en efectivo registrado por administrador',
            horarios_seleccionados: horariosSeleccionadosArray.length > 0 ? horariosSeleccionadosArray : null
        };

        const pago = await pagoService.crearPagoCompletado(id, datosPago);

        // Crear horarios fijos si es plan mensual o semanal y tiene horarios seleccionados
        if ((tipo_plan === 'mensual' || tipo_plan === 'semanal') && horariosSeleccionadosArray.length > 0) {
            try {
                const horarioFijoService = require('../services/horarioFijoService');
                
                // Calcular fechas de inicio y fin según tipo de plan
                const fechaInicio = new Date(datosPago.fecha_pago);
                const fechaFin = pago.fecha_vencimiento_plan 
                    ? new Date(pago.fecha_vencimiento_plan)
                    : (tipo_plan === 'mensual' 
                        ? new Date(fechaInicio.getTime() + 30 * 24 * 60 * 60 * 1000)
                        : new Date(fechaInicio.getTime() + 7 * 24 * 60 * 60 * 1000));

                await horarioFijoService.crearHorariosFijos(
                    id,
                    pago.id,
                    tipo_plan,
                    horariosSeleccionadosArray,
                    fechaInicio,
                    fechaFin
                );
            } catch (horarioError) {
                console.error('Error al crear horarios fijos:', horarioError);
                return res.status(400).json({
                    success: false,
                    message: `Error al asignar horarios: ${horarioError.message}`,
                    error: horarioError.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Pago en efectivo registrado exitosamente' + 
                ((tipo_plan === 'mensual' || tipo_plan === 'semanal') ? '. Horarios fijos asignados.' : ''),
            data: pago
        });
    } catch (error) {
        console.error('Error al registrar pago en efectivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar pago en efectivo',
            error: error.message
        });
    }
};

/**
 * POST /api/admin/alumnas/:id/reservacion
 * Crear una reservación para una alumna (solo admin)
 */
const crearReservacionAlumna = async (req, res) => {
    try {
        const { id } = req.params;
        const { horario_id, fecha_reserva } = req.body;

        if (!horario_id || !fecha_reserva) {
            return res.status(400).json({
                success: false,
                message: 'horario_id y fecha_reserva son requeridos'
            });
        }

        // Validar que la alumna existe
        const alumnas = await query(
            'SELECT id FROM usuarios WHERE id = ? AND rol = ?',
            [id, 'alumna']
        );

        if (alumnas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Alumna no encontrada'
            });
        }

        // Convertir fecha a objeto Date
        const fechaReserva = new Date(fecha_reserva);

        // Crear la reservación usando el servicio de admin (sin verificar acceso)
        const reservacionService = require('../services/reservacionService');
        const reservacion = await reservacionService.crearReservacionAdmin(
            parseInt(id),
            parseInt(horario_id),
            fechaReserva
        );

        res.status(201).json({
            success: true,
            message: 'Reservación creada exitosamente',
            data: reservacion
        });
    } catch (error) {
        console.error('Error al crear reservación:', error);
        
        if (error.message.includes('no encontrada') || 
            error.message.includes('no encontrado') ||
            error.message.includes('ya tiene una reservación') ||
            error.message.includes('fechas pasadas')) {
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

module.exports = {
    getAlumnas,
    getAlumna,
    registrarAlumnaRapida,
    registrarPagoEfectivo,
    crearReservacionAlumna
};




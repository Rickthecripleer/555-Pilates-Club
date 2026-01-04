const pagoService = require('../services/pagoService');
const { query } = require('../config/database');

/**
 * GET /api/admin/pagos/pendientes
 * Obtener todos los pagos pendientes (solo admin)
 */
const getPagosPendientes = async (req, res) => {
    try {
        // Obtener pagos pendientes con información de alumnas
        const pagos = await query(
            `SELECT 
                p.id,
                p.alumna_id,
                p.monto,
                p.fecha_pago,
                p.metodo_pago,
                p.tipo_plan,
                p.estatus,
                p.comprobante_url,
                p.fecha_vencimiento_plan,
                p.descripcion,
                p.fecha_creacion,
                u.nombre AS alumna_nombre,
                u.email AS alumna_email,
                u.telefono AS alumna_telefono
             FROM pagos p
             INNER JOIN usuarios u ON p.alumna_id = u.id
             WHERE p.estatus = 'pendiente'
             ORDER BY p.fecha_creacion DESC`
        );

        res.json({
            success: true,
            data: pagos,
            total: pagos.length
        });
    } catch (error) {
        console.error('Error al obtener pagos pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pagos pendientes',
            error: error.message
        });
    }
};

/**
 * GET /api/admin/pagos
 * Obtener todos los pagos (solo admin)
 */
const getAllPagos = async (req, res) => {
    try {
        const { estatus } = req.query;
        
        let sql = `
            SELECT 
                p.id,
                p.alumna_id,
                p.monto,
                p.fecha_pago,
                p.metodo_pago,
                p.tipo_plan,
                p.estatus,
                p.comprobante_url,
                p.fecha_vencimiento_plan,
                p.descripcion,
                p.fecha_creacion,
                u.nombre AS alumna_nombre,
                u.email AS alumna_email,
                u.telefono AS alumna_telefono
             FROM pagos p
             INNER JOIN usuarios u ON p.alumna_id = u.id
        `;

        const params = [];
        if (estatus) {
            sql += ' WHERE p.estatus = ?';
            params.push(estatus);
        }

        sql += ' ORDER BY p.fecha_creacion DESC';

        const pagos = await query(sql, params);

        res.json({
            success: true,
            data: pagos,
            total: pagos.length
        });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pagos',
            error: error.message
        });
    }
};

/**
 * PUT /api/admin/pagos/:id/validar
 * Validar o rechazar un pago (solo admin)
 */
const validarPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { aprobar } = req.body;

        if (typeof aprobar !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'El campo "aprobar" debe ser un booleano (true/false)'
            });
        }

        const pago = await pagoService.validarPago(parseInt(id), aprobar);

        // ✨ CREAR HORARIOS FIJOS Y RESERVACIONES AUTOMÁTICAS SI SE APRUEBA
        if (aprobar && (pago.tipo_plan === 'mensual' || pago.tipo_plan === 'semanal')) {
            try {
                // Obtener horarios seleccionados del pago o del body
                let horariosSeleccionadosArray = [];
                
                // Primero intentar desde el body (si el admin los está asignando manualmente)
                const { horarios_seleccionados } = req.body;
                if (horarios_seleccionados && Array.isArray(horarios_seleccionados) && horarios_seleccionados.length > 0) {
                    horariosSeleccionadosArray = horarios_seleccionados.map(h => parseInt(h));
                } 
                // Si no vienen en el body, intentar desde el campo del pago (horarios seleccionados por la alumna)
                else if (pago.horarios_seleccionados) {
                    try {
                        const horariosJson = typeof pago.horarios_seleccionados === 'string' 
                            ? JSON.parse(pago.horarios_seleccionados)
                            : pago.horarios_seleccionados;
                        horariosSeleccionadosArray = Array.isArray(horariosJson) 
                            ? horariosJson.map(h => parseInt(h))
                            : [];
                    } catch (parseError) {
                        console.error('Error al parsear horarios_seleccionados:', parseError);
                    }
                }
                
                if (horariosSeleccionadosArray.length > 0) {
                    const horarioFijoService = require('../services/horarioFijoService');
                    
                    // Calcular fechas de inicio y fin según tipo de plan
                    const fechaInicio = new Date(pago.fecha_pago);
                    const fechaFin = pago.fecha_vencimiento_plan 
                        ? new Date(pago.fecha_vencimiento_plan)
                        : (pago.tipo_plan === 'mensual' 
                            ? new Date(fechaInicio.getTime() + 30 * 24 * 60 * 60 * 1000)
                            : new Date(fechaInicio.getTime() + 7 * 24 * 60 * 60 * 1000));

                    await horarioFijoService.crearHorariosFijos(
                        pago.alumna_id,
                        pago.id,
                        pago.tipo_plan,
                        horariosSeleccionadosArray,
                        fechaInicio,
                        fechaFin
                    );
                }
            } catch (horarioError) {
                console.error('Error al crear horarios fijos:', horarioError);
                // No fallar el proceso si hay error en horarios fijos, pero informar al admin
                return res.status(400).json({
                    success: false,
                    message: `Pago aprobado, pero error al asignar horarios: ${horarioError.message}`,
                    data: pago
                });
            }
        }

        // ✨ ENVIAR NOTIFICACIÓN WHATSAPP A LA ALUMNA SI SE APRUEBA
        if (aprobar) {
            try {
                const { query } = require('../config/database');
                const { enviarNotificacionPagoAprobado } = require('../services/whatsappService');
                
                // Obtener datos de la alumna
                const usuarios = await query(
                    'SELECT nombre, telefono FROM usuarios WHERE id = ?',
                    [pago.alumna_id]
                );
                
                if (usuarios[0] && usuarios[0].telefono) {
                    await enviarNotificacionPagoAprobado({
                        telefonoAlumna: usuarios[0].telefono,
                        nombreAlumna: usuarios[0].nombre,
                        monto: parseFloat(pago.monto),
                        tipoPlan: pago.tipo_plan
                    });
                }
            } catch (whatsappError) {
                // No fallar el proceso si WhatsApp falla
                console.error('Error al enviar WhatsApp (no crítico):', whatsappError);
            }
        }

        res.json({
            success: true,
            message: aprobar 
                ? 'Pago aprobado exitosamente. Plan activado para la alumna.' 
                : 'Pago rechazado exitosamente.',
            data: pago
        });
    } catch (error) {
        console.error('Error al validar pago:', error);
        
        if (error.message === 'Pago no encontrado' || error.message === 'El pago ya fue procesado') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al validar el pago',
            error: error.message
        });
    }
};

module.exports = {
    getPagosPendientes,
    getAllPagos,
    validarPago
};




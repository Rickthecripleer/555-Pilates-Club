const pagoService = require('../services/pagoService');
const { COSTO_INSCRIPCION } = require('../config/constants');
const path = require('path');

/**
 * GET /api/pagos/verificar-inscripcion
 * Verificar si la alumna tiene inscripción pagada
 */
const verificarInscripcion = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const tieneInscripcion = await pagoService.tieneInscripcionPagada(alumnaId);
        
        res.json({
            success: true,
            data: {
                tieneInscripcion
            }
        });
    } catch (error) {
        console.error('Error al verificar inscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar inscripción',
            error: error.message
        });
    }
};

/**
 * POST /api/pagos/comprobante
 * Subir comprobante de pago
 */
const subirComprobante = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ningún archivo'
            });
        }

        const alumnaId = req.user.id;
        const { monto, fecha_pago, metodo_pago, tipo_plan, descripcion, horarios_seleccionados } = req.body;

        // Si es inscripción, permitir siempre (no requiere validación previa)
        // Si es mensualidad, verificar si tiene inscripción pagada
        let montoFinal = parseFloat(monto);
        let descripcionFinal = descripcion || '';
        
        if (tipo_plan === 'mensual') {
            // Verificar si ya tiene inscripción pagada
            const tieneInscripcion = await pagoService.tieneInscripcionPagada(alumnaId);
            if (!tieneInscripcion) {
                // Agregar costo de inscripción al monto de la mensualidad
                montoFinal = parseFloat(monto) + COSTO_INSCRIPCION;
                const descripcionBase = descripcion || 'Mensualidad';
                descripcionFinal = `${descripcionBase} (Mensualidad: $${parseFloat(monto).toFixed(2)} + Inscripción: $${COSTO_INSCRIPCION.toFixed(2)})`;
            }
        }
        
        // Si es inscripción, no requiere validación previa (puede pagarla directamente)

        // NUEVA REGLA: Transferencias siempre inician como 'pendiente'
        // Efectivo y otros métodos también inician como 'pendiente' (el admin los aprueba)
        const estatusInicial = 'pendiente';

        // Construir URL del comprobante (ruta relativa o absoluta según tu configuración)
        const comprobanteUrl = `/uploads/comprobantes/${req.file.filename}`;

        // Preparar horarios seleccionados si es plan mensual o semanal
        let horariosSeleccionadosArray = [];
        if ((tipo_plan === 'mensual' || tipo_plan === 'semanal') && horarios_seleccionados) {
            // Convertir a array si viene como string o array
            if (Array.isArray(horarios_seleccionados)) {
                horariosSeleccionadosArray = horarios_seleccionados.map(h => parseInt(h));
            } else if (typeof horarios_seleccionados === 'string') {
                try {
                    horariosSeleccionadosArray = JSON.parse(horarios_seleccionados).map(h => parseInt(h));
                } catch {
                    horariosSeleccionadosArray = [parseInt(horarios_seleccionados)];
                }
            }
        }

        // Crear registro de pago
        const pago = await pagoService.crearPago(
            alumnaId,
            {
                monto: montoFinal,
                fecha_pago,
                metodo_pago,
                tipo_plan,
                descripcion: descripcionFinal,
                horarios_seleccionados: horariosSeleccionadosArray.length > 0 ? JSON.stringify(horariosSeleccionadosArray) : null
            },
            comprobanteUrl,
            estatusInicial
        );

        // ✨ ENVIAR NOTIFICACIÓN WHATSAPP A LA ADMINISTRADORA CON COMPROBANTE
        try {
            const { enviarNotificacionWhatsApp } = require('../services/whatsappService');
            const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
            const comprobanteFullUrl = `${baseUrl}${comprobanteUrl}`;
            
            await enviarNotificacionWhatsApp({
                nombreAlumna: req.user.nombre,
                monto: parseFloat(monto),
                tipoPlan: tipo_plan,
                pagoId: pago.id,
                comprobanteUrl: comprobanteFullUrl,
                comprobantePath: req.file.path // Ruta del archivo para enviar imagen
            });
        } catch (whatsappError) {
            // No fallar el proceso si WhatsApp falla
            console.error('Error al enviar WhatsApp (no crítico):', whatsappError);
        }

        res.status(201).json({
            success: true,
            message: 'Comprobante subido exitosamente. Esperando validación del administrador.',
            data: {
                pago_id: pago.id,
                estatus: pago.estatus,
                comprobante_url: comprobanteUrl
            }
        });
    } catch (error) {
        console.error('Error al subir comprobante:', error);
        res.status(500).json({
            success: false,
            message: 'Error al subir el comprobante',
            error: error.message
        });
    }
};

/**
 * GET /api/pagos/mis-pagos
 * Obtener pagos de la alumna autenticada
 */
const getMisPagos = async (req, res) => {
    try {
        const alumnaId = req.user.id;
        const pagos = await pagoService.getPagosAlumna(alumnaId);

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

module.exports = {
    verificarInscripcion,
    subirComprobante,
    getMisPagos
};




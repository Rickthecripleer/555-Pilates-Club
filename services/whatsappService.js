const whatsappConfig = require('../config/whatsapp');

/**
 * Enviar notificación de nuevo pago a la administradora
 * @param {Object} datos - Datos del pago y alumna
 * @returns {Promise<boolean>} true si se envió exitosamente
 */
const enviarNotificacionWhatsApp = async (datos) => {
    try {
        const { 
            telefonoAdmin = whatsappConfig.adminPhone, 
            nombreAlumna, 
            monto, 
            tipoPlan, 
            pagoId,
            comprobanteUrl,
            comprobantePath
        } = datos;
        
        const nombrePlan = tipoPlan === 'mensual' ? 'Mensualidad' 
            : tipoPlan === 'paquete' ? 'Paquete Semanal'
            : tipoPlan === 'sesion' ? 'Clase Individual'
            : tipoPlan === 'inscripcion' ? 'Inscripcion'
            : tipoPlan;
        
        // Mensaje sin emojis para evitar problemas de codificación
        const mensaje = `*Nuevo Pago Pendiente*

*Alumna:* ${nombreAlumna}
*Monto:* $${monto}
*Plan:* ${nombrePlan}
*ID Pago:* ${pagoId}

*Comprobante:* ${comprobanteUrl || 'Ver en el sistema'}

Revisa el sistema para validar el comprobante.`;

        // ============================================
        // ENVÍO AUTOMÁTICO DE WHATSAPP
        // ============================================
        
        // Verificar si hay configuración de API
        if (!whatsappConfig.apiKey || !whatsappConfig.apiUrl) {
            console.log('📱 [WhatsApp] Notificación preparada (modo desarrollo):');
            console.log(`   Para: ${telefonoAdmin}`);
            console.log(`   Mensaje: ${mensaje}`);
            console.log(`   Comprobante: ${comprobanteUrl}`);
            console.log('   ⚠️ Configura WHATSAPP_API_KEY y WHATSAPP_API_URL en .env para envío real');
            return true;
        }

        try {
            // OPCIÓN 1: WhatsApp Business API (Meta) - RECOMENDADO
            if (whatsappConfig.apiUrl.includes('graph.facebook.com') || whatsappConfig.apiUrl.includes('whatsapp')) {
                await enviarWhatsAppBusinessAPI(telefonoAdmin, mensaje, comprobanteUrl, comprobantePath);
                return true;
            }
            
            // OPCIÓN 2: Twilio
            if (whatsappConfig.apiUrl.includes('twilio') || whatsappConfig.accountId) {
                await enviarWhatsAppTwilio(telefonoAdmin, mensaje, comprobanteUrl);
                return true;
            }
            
            // OPCIÓN 3: API personalizada
            await enviarWhatsAppPersonalizado(telefonoAdmin, mensaje, comprobanteUrl);
            return true;
            
        } catch (error) {
            console.error('❌ Error al enviar WhatsApp:', error);
            // No fallar el proceso si WhatsApp falla
            return false;
        }
    } catch (error) {
        console.error('❌ Error al enviar WhatsApp:', error);
        // No fallar el proceso si WhatsApp falla
        return false;
    }
};

/**
 * Enviar recordatorio de vencimiento de plan
 * @param {Object} datos - Datos del plan y alumna
 * @returns {Promise<boolean>}
 */
const enviarRecordatorioVencimiento = async (datos) => {
    try {
        const { telefonoAlumna, nombreAlumna, fechaVencimiento, tipoPlan } = datos;
        
        const mensaje = `⏰ *Recordatorio de Vencimiento*

Hola ${nombreAlumna},

Tu plan ${tipoPlan} vence el ${fechaVencimiento}.

Renueva tu plan para seguir disfrutando de nuestras clases.`;

        // Implementar envío de WhatsApp (similar a enviarNotificacionWhatsApp)
        console.log('📱 [WhatsApp] Recordatorio preparado:');
        console.log(`   Para: ${telefonoAlumna}`);
        console.log(`   Mensaje: ${mensaje}`);
        
        return true;
    } catch (error) {
        console.error('❌ Error al enviar recordatorio:', error);
        return false;
    }
};

/**
 * Enviar notificación cuando se aprueba un pago
 * @param {Object} datos - Datos del pago aprobado
 * @returns {Promise<boolean>}
 */
const enviarNotificacionPagoAprobado = async (datos) => {
    try {
        const { telefonoAlumna, nombreAlumna, monto, tipoPlan } = datos;
        
        const nombrePlan = tipoPlan === 'mensual' ? 'Mensualidad' 
            : tipoPlan === 'paquete' ? 'Paquete Semanal'
            : tipoPlan === 'sesion' ? 'Clase Individual'
            : tipoPlan;
        
        const mensaje = `✅ *Pago Aprobado*

Hola ${nombreAlumna},

Tu pago de $${monto} (${nombrePlan}) ha sido aprobado.

Tu plan está activo. ¡Ya puedes reservar clases!`;

        // Implementar envío
        console.log('📱 [WhatsApp] Notificación de aprobación preparada');
        
        return true;
    } catch (error) {
        console.error('❌ Error al enviar notificación:', error);
        return false;
    }
};

/**
 * Enviar mensaje usando WhatsApp Business API (Meta)
 */
const enviarWhatsAppBusinessAPI = async (telefono, mensaje, comprobanteUrl, comprobantePath) => {
    const fs = require('fs');
    const FormData = require('form-data');
    
    // Obtener el número de teléfono desde la configuración
    const phoneNumberId = whatsappConfig.phoneNumberId || whatsappConfig.accountId;
    
    if (!phoneNumberId) {
        throw new Error('WHATSAPP_PHONE_NUMBER_ID no configurado en .env');
    }
    
    // Construir URL base
    const baseUrl = whatsappConfig.apiUrl.includes('graph.facebook.com') 
        ? `${whatsappConfig.apiUrl}/${phoneNumberId}`
        : `https://graph.facebook.com/v18.0/${phoneNumberId}`;
    
    // 1. Enviar mensaje de texto
    const messageResponse = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${whatsappConfig.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: telefono,
            type: 'text',
            text: { body: mensaje }
        })
    });
    
    if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        throw new Error(`Error al enviar mensaje: ${JSON.stringify(errorData)}`);
    }
    
    console.log('✅ Mensaje de WhatsApp enviado exitosamente');
    
    // 2. Enviar imagen del comprobante si existe
    if (comprobantePath && fs.existsSync(comprobantePath) && comprobanteUrl) {
        try {
            // Primero subir la imagen
            const formData = new FormData();
            formData.append('file', fs.createReadStream(comprobantePath));
            formData.append('messaging_product', 'whatsapp');
            formData.append('type', 'image');
            
            const uploadUrl = whatsappConfig.apiUrl.includes('graph.facebook.com')
                ? whatsappConfig.apiUrl.replace(/\/v\d+\.\d+$/, '')
                : 'https://graph.facebook.com';
            
            const uploadResponse = await fetch(`${uploadUrl}/v18.0/media`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${whatsappConfig.apiKey}`
                },
                body: formData
            });
            
            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                const mediaId = uploadData.id;
                
                // Enviar la imagen
                const imageResponse = await fetch(`${baseUrl}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${whatsappConfig.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: telefono,
                        type: 'image',
                        image: { id: mediaId }
                    })
                });
                
                if (imageResponse.ok) {
                    console.log('✅ Imagen del comprobante enviada exitosamente');
                } else {
                    console.warn('⚠️ No se pudo enviar la imagen, pero el mensaje se envió');
                }
            }
        } catch (imageError) {
            console.warn('⚠️ Error al enviar imagen (no crítico):', imageError.message);
        }
    }
};

/**
 * Enviar mensaje usando Twilio
 */
const enviarWhatsAppTwilio = async (telefono, mensaje, comprobanteUrl) => {
    const twilio = require('twilio');
    const client = twilio(whatsappConfig.accountId, whatsappConfig.apiKey);
    
    // Enviar mensaje de texto
    await client.messages.create({
        from: `whatsapp:+${whatsappConfig.adminPhone}`,
        to: `whatsapp:+${telefono}`,
        body: mensaje
    });
    
    console.log('✅ Mensaje de WhatsApp (Twilio) enviado exitosamente');
    
    // Enviar imagen si hay URL
    if (comprobanteUrl) {
        try {
            await client.messages.create({
                from: `whatsapp:+${whatsappConfig.adminPhone}`,
                to: `whatsapp:+${telefono}`,
                mediaUrl: [comprobanteUrl]
            });
            console.log('✅ Imagen del comprobante enviada (Twilio)');
        } catch (imageError) {
            console.warn('⚠️ Error al enviar imagen (no crítico):', imageError.message);
        }
    }
};

/**
 * Enviar mensaje usando API personalizada
 */
const enviarWhatsAppPersonalizado = async (telefono, mensaje, comprobanteUrl) => {
    const response = await fetch(whatsappConfig.apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${whatsappConfig.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: telefono,
            message: mensaje,
            image: comprobanteUrl || null
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error en API personalizada: ${JSON.stringify(errorData)}`);
    }
    
    console.log('✅ Mensaje de WhatsApp (API personalizada) enviado exitosamente');
};

module.exports = {
    enviarNotificacionWhatsApp,
    enviarRecordatorioVencimiento,
    enviarNotificacionPagoAprobado
};






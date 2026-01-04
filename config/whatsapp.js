/**
 * Configuración de WhatsApp
 * 
 * INSTRUCCIONES:
 * 1. Agrega tu número de teléfono en formato internacional (ej: 5219612315035)
 * 2. Configura tu servicio de WhatsApp (Twilio, WhatsApp Business API, etc.)
 * 3. Agrega las variables al archivo .env
 */

module.exports = {
    // Número de teléfono de la administradora (formato internacional sin +)
    // México: 52 + código de área + número
    // Ejemplo: 529518057342 (52 + 951 + 8057342)
    adminPhone: process.env.WHATSAPP_ADMIN_PHONE || '529518057342',
    
    // API Key de tu servicio de WhatsApp
    // Para WhatsApp Business API: Token de acceso permanente
    // Para Twilio: Auth Token
    apiKey: process.env.WHATSAPP_API_KEY || '',
    
    // URL del servicio de WhatsApp
    // Para WhatsApp Business API: https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}
    // Para Twilio: (no necesario, se usa el SDK)
    // Para API personalizada: URL de tu servicio
    apiUrl: process.env.WHATSAPP_API_URL || '',
    
    // ID de cuenta o Phone Number ID
    // Para WhatsApp Business API: ID del número de teléfono de WhatsApp Business
    // Para Twilio: Account SID
    accountId: process.env.WHATSAPP_ACCOUNT_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    
    // Phone Number ID (específico para WhatsApp Business API)
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
};






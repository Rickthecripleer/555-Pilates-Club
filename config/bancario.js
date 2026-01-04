/**
 * Configuración de Datos Bancarios
 * 
 * INSTRUCCIONES:
 * 1. Completa los datos bancarios reales
 * 2. Agrega las variables al archivo .env para mayor seguridad
 */

module.exports = {
    banco: process.env.BANCO_NOMBRE || 'BBVA',
    clabe: process.env.BANCO_CLABE || '',
    cuenta: process.env.BANCO_CUENTA || '153 492 8787',
    tarjeta: process.env.BANCO_TARJETA || '4152 3144 3073 4171',
    titular: process.env.BANCO_TITULAR || 'SODELVA MORALES',
    referencia: process.env.BANCO_REFERENCIA || '555 Pilates Club',
    
    // Información adicional opcional
    sucursal: process.env.BANCO_SUCURSAL || '',
    rfc: process.env.BANCO_RFC || '',
};








/**
 * Constantes del sistema
 * Valores importantes que deben mantenerse consistentes en todo el sistema
 */

module.exports = {
    // Costo de inscripción (IMPORTANTE: Este valor debe ser consistente en todo el sistema)
    COSTO_INSCRIPCION: 120,
    
    // Capacidad máxima de clases (IMPORTANTE: Este valor debe ser consistente en todo el sistema)
    CAPACIDAD_MAXIMA_CLASE: 11,
    
    // Días de vigencia por tipo de plan
    VIGENCIA_PLANES: {
        mensual: 30,
        semanal: 7,
        sesion: 90,
        paquete: 7 // Para paquetes semanales (2, 3, 4 clases)
    }
};


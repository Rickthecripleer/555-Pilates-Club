const claseService = require('../services/claseService');

/**
 * GET /api/clases/disponibles
 * Obtener clases disponibles filtradas por horario
 */
const getClasesDisponibles = async (req, res) => {
    try {
        const { dia_semana, hora_inicio, hora_fin, fecha } = req.query;
        
        let clases;

        if (fecha) {
            // Si se proporciona una fecha específica, buscar por esa fecha
            // Parsear la fecha en formato YYYY-MM-DD como fecha local (no UTC)
            // Esto evita problemas de zona horaria que pueden cambiar el día de la semana
            const fechaMatch = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!fechaMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de fecha inválido. Use formato YYYY-MM-DD'
                });
            }
            
            const [, year, month, day] = fechaMatch.map(Number);
            const fechaObj = new Date(year, month - 1, day);
            
            if (isNaN(fechaObj.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Fecha inválida'
                });
            }
            
            clases = await claseService.getClasesDisponiblesPorFecha(fechaObj, {
                hora_inicio,
                hora_fin
            });
        } else {
            // Buscar clases disponibles (por defecto hoy)
            clases = await claseService.getClasesDisponibles({
                dia_semana,
                hora_inicio,
                hora_fin
            });
        }

        res.json({
            success: true,
            data: clases,
            total: clases.length
        });
    } catch (error) {
        console.error('Error al obtener clases disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener clases disponibles',
            error: error.message
        });
    }
};

module.exports = {
    getClasesDisponibles
};









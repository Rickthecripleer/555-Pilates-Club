const { body, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Errores de validación',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validaciones para crear una reservación
 */
const validateReservacion = [
    body('horario_id')
        .isInt({ min: 1 })
        .withMessage('El horario_id debe ser un número entero válido'),
    body('fecha_reserva')
        .isISO8601()
        .toDate()
        .withMessage('La fecha_reserva debe ser una fecha válida en formato ISO8601'),
    body('fecha_reserva')
        .custom((value) => {
            const fecha = new Date(value);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            if (fecha < hoy) {
                throw new Error('No se pueden hacer reservaciones para fechas pasadas');
            }
            return true;
        }),
    handleValidationErrors
];

/**
 * Validaciones para subir comprobante de pago
 */
const validateComprobante = [
    body('monto')
        .isFloat({ min: 0.01 })
        .withMessage('El monto debe ser un número mayor a 0'),
    body('fecha_pago')
        .isISO8601()
        .toDate()
        .withMessage('La fecha_pago debe ser una fecha válida en formato ISO8601'),
    body('metodo_pago')
        .isIn(['efectivo', 'tarjeta', 'transferencia', 'otro'])
        .withMessage('El método de pago debe ser: efectivo, tarjeta, transferencia u otro'),
    body('tipo_plan')
        .isIn(['mensual', 'semanal', 'sesion', 'paquete', 'inscripcion'])
        .withMessage('El tipo de plan debe ser: mensual, semanal, sesion, paquete o inscripcion'),
    body('descripcion')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateReservacion,
    validateComprobante
};








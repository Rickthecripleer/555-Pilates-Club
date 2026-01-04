const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { authenticate, requireAlumna } = require('../middleware/auth');
const { validateComprobante } = require('../middleware/validation');
const upload = require('../config/upload');

// Todas las rutas requieren autenticación y ser alumna
router.use(authenticate);
router.use(requireAlumna);

// GET /api/pagos/verificar-inscripcion
router.get('/verificar-inscripcion', pagoController.verificarInscripcion);

// GET /api/pagos/mis-pagos
router.get('/mis-pagos', pagoController.getMisPagos);

// POST /api/pagos/comprobante
// upload.single('comprobante') espera un campo llamado 'comprobante' en el form-data
router.post(
    '/comprobante',
    upload.single('comprobante'),
    validateComprobante,
    pagoController.subirComprobante
);

module.exports = router;








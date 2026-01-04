const express = require('express');
const router = express.Router();
const reservacionController = require('../controllers/reservacionController');
const { authenticate, requireAlumna } = require('../middleware/auth');
const { validateReservacion } = require('../middleware/validation');

// Todas las rutas requieren autenticación y ser alumna
router.use(authenticate);
router.use(requireAlumna);

// GET /api/reservaciones/verificar-acceso
router.get('/verificar-acceso', reservacionController.verificarAcceso);

// GET /api/reservaciones/mis-reservaciones
router.get('/mis-reservaciones', reservacionController.getMisReservaciones);

// POST /api/reservaciones
router.post('/', validateReservacion, reservacionController.crearReservacion);

// PUT /api/reservaciones/:id/cancelar
router.put('/:id/cancelar', reservacionController.cancelarReservacion);

module.exports = router;









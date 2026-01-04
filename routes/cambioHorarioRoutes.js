const express = require('express');
const router = express.Router();
const cambioHorarioController = require('../controllers/cambioHorarioController');
const { authenticate, requireAlumna } = require('../middleware/auth');

// Rutas para alumnas
router.use(authenticate);
router.use(requireAlumna);

// GET /api/cambios-horario/info
router.get('/info', cambioHorarioController.getInfoCambios);

// POST /api/cambios-horario/registrar
router.post('/registrar', cambioHorarioController.registrarCambioHorario);

module.exports = router;



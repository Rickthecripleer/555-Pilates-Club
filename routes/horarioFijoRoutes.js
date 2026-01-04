const express = require('express');
const router = express.Router();
const horarioFijoController = require('../controllers/horarioFijoController');
const { authenticate, requireAlumna } = require('../middleware/auth');

// Rutas para alumnas
router.use(authenticate);
router.use(requireAlumna);

// GET /api/horarios-fijos/verificar-necesidad
router.get('/verificar-necesidad', horarioFijoController.verificarNecesidadHorariosFijos);

// POST /api/horarios-fijos/crear
router.post('/crear', horarioFijoController.crearHorariosFijosAlumna);

// GET /api/horarios-fijos/disponibles
router.get('/disponibles', horarioFijoController.getHorariosDisponibles);

// GET /api/horarios-fijos/mis-horarios
router.get('/mis-horarios', horarioFijoController.getMisHorariosFijos);

module.exports = router;


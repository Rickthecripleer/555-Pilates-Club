const express = require('express');
const router = express.Router();
const claseController = require('../controllers/claseController');
const { authenticate } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/clases/disponibles
router.get('/disponibles', claseController.getClasesDisponibles);

module.exports = router;










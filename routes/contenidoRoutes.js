const express = require('express');
const router = express.Router();
const contenidoNosotrosController = require('../controllers/contenidoNosotrosController');
const { authenticate } = require('../middleware/auth');

// Rutas públicas (requieren autenticación pero no admin)
router.use(authenticate);

// GET /api/contenido/nosotros - Obtener todo el contenido
router.get('/nosotros', contenidoNosotrosController.obtenerContenido);

// GET /api/contenido/nosotros/:seccion - Obtener contenido de una sección
router.get('/nosotros/:seccion', contenidoNosotrosController.obtenerContenidoPorSeccion);

module.exports = router;


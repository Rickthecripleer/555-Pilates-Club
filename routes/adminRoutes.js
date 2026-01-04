const express = require('express');
const router = express.Router();
const adminPagoController = require('../controllers/adminPagoController');
const adminAlumnaController = require('../controllers/adminAlumnaController');
const adminReservacionController = require('../controllers/adminReservacionController');
const contenidoNosotrosController = require('../controllers/contenidoNosotrosController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadContenido } = contenidoNosotrosController;

// Todas las rutas requieren autenticación y ser admin
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/pagos/pendientes
router.get('/pagos/pendientes', adminPagoController.getPagosPendientes);

// GET /api/admin/pagos
router.get('/pagos', adminPagoController.getAllPagos);

// PUT /api/admin/pagos/:id/validar
router.put('/pagos/:id/validar', adminPagoController.validarPago);

// GET /api/admin/alumnas
router.get('/alumnas', adminAlumnaController.getAlumnas);

// GET /api/admin/alumnas/:id
router.get('/alumnas/:id', adminAlumnaController.getAlumna);

// POST /api/admin/alumnas/registro-rapido
router.post('/alumnas/registro-rapido', adminAlumnaController.registrarAlumnaRapida);

// POST /api/admin/alumnas/:id/pago-efectivo
router.post('/alumnas/:id/pago-efectivo', adminAlumnaController.registrarPagoEfectivo);

// POST /api/admin/alumnas/:id/reservacion
router.post('/alumnas/:id/reservacion', adminAlumnaController.crearReservacionAlumna);

// GET /api/admin/reservaciones/dia
router.get('/reservaciones/dia', adminReservacionController.getReservacionesPorDia);

// GET /api/admin/reservaciones/resumen
router.get('/reservaciones/resumen', adminReservacionController.getResumenReservaciones);

// PUT /api/admin/contenido/nosotros - Actualizar contenido individual
router.put('/contenido/nosotros', contenidoNosotrosController.actualizarContenido);

// PUT /api/admin/contenido/nosotros/multiple - Actualizar múltiples campos
router.put('/contenido/nosotros/multiple', contenidoNosotrosController.actualizarContenidoMultiple);

// POST /api/admin/contenido/nosotros/imagen - Subir imagen
router.post('/contenido/nosotros/imagen', uploadContenido, contenidoNosotrosController.subirImagen);

module.exports = router;






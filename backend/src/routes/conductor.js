const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const cond = require('../controllers/conductor.controller');
const { upload, subirArchivo, subirEvidencia } = require('../controllers/upload.controller');

const isConductor = [requireAuth, requireRole('conductor')];

// Dashboard
router.get('/dashboard', ...isConductor, cond.dashboardConductor);

// Servicios
router.get('/servicios', ...isConductor, cond.misServicios);
router.get('/servicios/:id', ...isConductor, cond.detalleServicio);
router.post('/servicios/:id/iniciar', ...isConductor, cond.iniciarServicio);
router.post('/servicios/:id/finalizar', ...isConductor, cond.finalizarServicio);

// Vehículo asignado
router.get('/vehiculo', ...isConductor, cond.miVehiculo);

// Combustible
router.post('/combustible', ...isConductor, cond.registrarCombustible);
router.get('/combustible', ...isConductor, cond.historialCombustible);

// Novedades
router.post('/novedades', ...isConductor, cond.reportarNovedad);
router.get('/novedades', ...isConductor, cond.misNovedades);

// Uploads
router.post('/upload', ...isConductor, upload.single('archivo'), subirArchivo);
router.post('/evidencia', ...isConductor, upload.single('archivo'), subirEvidencia);

module.exports = router;

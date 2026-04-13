const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const sol = require('../controllers/solicitudes.controller');
const prog = require('../controllers/programacion.controller');
const admin = require('../controllers/admin.controller');

const isAdmin = [requireAuth, requireRole('admin')];

// Dashboard
router.get('/dashboard', ...isAdmin, sol.dashboardAdmin);

// Solicitudes
router.get('/solicitudes', ...isAdmin, sol.listarTodas);
router.get('/solicitudes/:id', ...isAdmin, sol.detalle);
router.patch('/solicitudes/:id', ...isAdmin, sol.editar);
router.patch('/solicitudes/:id/rechazar', ...isAdmin, sol.rechazar);
router.patch('/solicitudes/:id/cancelar', ...isAdmin, sol.cancelar);

// Programación
router.get('/vehiculos/disponibles', ...isAdmin, prog.vehiculosDisponibles);
router.get('/conductores/disponibles', ...isAdmin, prog.conductoresDisponibles);
router.post('/solicitudes/:id/programar', ...isAdmin, prog.programar);
router.patch('/asignaciones/:id/reprogramar', ...isAdmin, prog.reprogramar);
router.get('/calendario', ...isAdmin, prog.calendarioDia);

// Vehículos CRUD
router.get('/vehiculos', ...isAdmin, admin.listarVehiculos);
router.post('/vehiculos', ...isAdmin, admin.crearVehiculo);
router.patch('/vehiculos/:id', ...isAdmin, admin.actualizarVehiculo);
router.delete('/vehiculos/:id', ...isAdmin, admin.desactivarVehiculo);

// Conductores CRUD
router.get('/conductores', ...isAdmin, admin.listarConductores);
router.post('/conductores', ...isAdmin, admin.crearConductor);
router.patch('/conductores/:id', ...isAdmin, admin.actualizarConductor);
router.delete('/conductores/:id', ...isAdmin, admin.desactivarConductor);

// Documentos
router.get('/documentos', ...isAdmin, admin.listarDocumentos);
router.post('/documentos', ...isAdmin, admin.crearDocumento);
router.patch('/documentos/:id', ...isAdmin, admin.actualizarDocumento);

// Novedades
router.get('/novedades', ...isAdmin, admin.listarNovedades);
router.patch('/novedades/:id', ...isAdmin, admin.actualizarNovedad);

// Mantenimientos
router.get('/mantenimientos', ...isAdmin, admin.listarMantenimientos);
router.post('/mantenimientos', ...isAdmin, admin.crearMantenimiento);
router.patch('/mantenimientos/:id', ...isAdmin, admin.actualizarMantenimiento);

// Combustible
router.get('/combustible',       ...isAdmin, admin.listarCombustible);
router.post('/combustible',      ...isAdmin, admin.crearCombustible);
router.patch('/combustible/:id', ...isAdmin, admin.actualizarCombustible);

// Cambios de aceite
router.get('/aceite',                       ...isAdmin, admin.listarEstadoAceite);
router.post('/aceite',                      ...isAdmin, admin.crearCambioAceite);
router.get('/aceite/vehiculo/:id/historial', ...isAdmin, admin.historialAceiteVehiculo);

// Historial
router.get('/conductores/:id/historial', ...isAdmin, admin.historialConductor);
router.get('/vehiculos/:id/historial', ...isAdmin, admin.historialVehiculo);

// Calendario (reservas por rango de fechas)
router.get('/vehiculos/:id/calendario', ...isAdmin, admin.calendarioVehiculo);
router.get('/conductores/:id/calendario', ...isAdmin, admin.calendarioConductor);

// Catálogos
router.get('/dependencias', ...isAdmin, admin.dependencias);

module.exports = router;

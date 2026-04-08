const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/whatsapp.controller');

// Todos sin auth — llamados por n8n desde la red interna Docker
router.get('/contexto',              ctrl.contexto);
router.get('/sesion',                ctrl.getSesion);
router.post('/sesion',               ctrl.setSesion);
router.get('/dependencias',          ctrl.getDependencias);
router.post('/crear-solicitud',      ctrl.crearSolicitud);
router.get('/mis-solicitudes',       ctrl.misSolicitudes);
router.post('/cancelar-solicitud',   ctrl.cancelarSolicitud);
router.post('/confirmar-servicio',   ctrl.confirmarServicio);
router.post('/encuesta',             ctrl.guardarEncuesta);
router.get('/servicios-conductor',   ctrl.serviciosConductorWa);
router.post('/iniciar-servicio-wa',  ctrl.iniciarServicioWa);
router.post('/finalizar-servicio-wa', ctrl.finalizarServicioWa);
router.post('/recordatorios',        ctrl.recordatorios);

// Crear solicitud con campos nuevos — llamado por n8n
const solCtrl = require('../controllers/solicitudes.controller');
router.post('/solicitud', solCtrl.crear);

// Búsqueda de conocimiento — llamado por n8n AI Agent
const conocimientoCtrl = require('../controllers/conocimiento.controller');
router.get('/conocimiento/buscar', conocimientoCtrl.buscar);

module.exports = router;

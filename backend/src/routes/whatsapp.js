const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/whatsapp.controller');
const { requireApiKey } = require('../middleware/auth');

// ─── TODAS las rutas de este archivo son llamadas por n8n desde fuera de la red
//     interna y por eso exigen header x-api-key: N8N_API_KEY. Antes (cuando n8n
//     corría en Docker local) algunas quedaron sin auth; al mover n8n a un VPS
//     externo TODOS los endpoints quedaron expuestos a internet — se blindan aquí.

router.use(requireApiKey);

// Contexto y sesiones
router.get('/contexto',               ctrl.contexto);
router.get('/sesion',                 ctrl.getSesion);
router.post('/sesion',                ctrl.setSesion);
router.get('/dependencias',           ctrl.getDependencias);

// Flujo de solicitud (WhatsApp bot)
router.post('/crear-solicitud',       ctrl.crearSolicitud);
router.get('/mis-solicitudes',        ctrl.misSolicitudes);
router.post('/cancelar-solicitud',    ctrl.cancelarSolicitud);
router.post('/confirmar-servicio',    ctrl.confirmarServicio);
router.post('/encuesta',              ctrl.guardarEncuesta);

// Flujo del conductor por WhatsApp
router.get('/servicios-conductor',    ctrl.serviciosConductorWa);
router.post('/iniciar-servicio-wa',   ctrl.iniciarServicioWa);
router.post('/finalizar-servicio-wa', ctrl.finalizarServicioWa);

// Recordatorios (cron en n8n)
router.get('/recordatorios',          ctrl.recordatorios);

// Crear solicitud con campos nuevos (endpoint "moderno")
const solCtrl = require('../controllers/solicitudes.controller');
router.post('/solicitud',             solCtrl.crear);
router.get('/solicitud/:id',          solCtrl.detallePorApiKey);
router.post('/solicitud/cancelar',    solCtrl.cancelarPorApiKey);

// Búsqueda híbrida de conocimiento (AI Agent de n8n)
const conocimientoCtrl = require('../controllers/conocimiento.controller');
router.get('/conocimiento/buscar',    conocimientoCtrl.buscar);

module.exports = router;

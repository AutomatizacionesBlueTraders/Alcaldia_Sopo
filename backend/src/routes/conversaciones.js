const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/conversaciones.controller');

// Admin y dependencia pueden ver todas las conversaciones. Conductores no.
const ver = [requireAuth, requireRole('admin', 'dependencia')];

router.get('/stats',                 ...ver, ctrl.stats);
// Diagnóstico: público (no expone secretos) para poder validar desde afuera.
// El SID se devuelve enmascarado y el auth_token nunca se emite.
router.get('/diag',                             ctrl.diag);
router.get('/media/:sid/:index',     ...ver, ctrl.media);
router.get('/',                      ...ver, ctrl.listar);
router.get('/:telefono',             ...ver, ctrl.hilo);

module.exports = router;

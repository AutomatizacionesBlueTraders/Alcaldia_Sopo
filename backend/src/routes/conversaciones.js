const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/conversaciones.controller');

// Admin y dependencia pueden ver todas las conversaciones. Conductores no.
const ver = [requireAuth, requireRole('admin', 'dependencia')];

router.get('/stats',         ...ver, ctrl.stats);
router.get('/',              ...ver, ctrl.listar);
router.get('/:telefono',     ...ver, ctrl.hilo);

module.exports = router;

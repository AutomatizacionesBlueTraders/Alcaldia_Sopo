const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const sol = require('../controllers/solicitudes.controller');

// Dependencia
router.get('/dashboard', requireAuth, requireRole('dependencia'), sol.dashboardDependencia);
router.post('/', requireAuth, requireRole('dependencia'), sol.crear);
router.get('/', requireAuth, requireRole('dependencia'), sol.listarPorDependencia);
router.get('/:id', requireAuth, sol.detalle);
router.patch('/:id/cancelar', requireAuth, sol.cancelar);
router.post('/:id/transferir', requireAuth, requireRole('dependencia'), sol.transferir);

module.exports = router;

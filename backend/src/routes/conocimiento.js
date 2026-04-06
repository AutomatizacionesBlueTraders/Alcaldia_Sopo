const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/conocimiento.controller');

// CRUD — requiere auth de dependencia
router.get('/',       requireAuth, requireRole('dependencia'), ctrl.listar);
router.post('/',      requireAuth, requireRole('dependencia'), ctrl.crear);
router.put('/:id',    requireAuth, requireRole('dependencia'), ctrl.actualizar);
router.delete('/:id', requireAuth, requireRole('dependencia'), ctrl.eliminar);

module.exports = router;

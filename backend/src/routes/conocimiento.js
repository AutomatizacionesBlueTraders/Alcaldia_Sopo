const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/conocimiento.controller');
const { upload } = require('../controllers/upload.controller');

const isDep = [requireAuth, requireRole('dependencia')];

// CRUD — requiere auth de dependencia
router.get('/',       ...isDep, ctrl.listar);
router.post('/',      ...isDep, upload.single('archivo'), ctrl.crear);
router.put('/:id',    ...isDep, upload.single('archivo'), ctrl.actualizar);
router.delete('/:id', ...isDep, ctrl.eliminar);
router.patch('/:id/quitar-archivo', ...isDep, ctrl.quitarArchivo);

module.exports = router;

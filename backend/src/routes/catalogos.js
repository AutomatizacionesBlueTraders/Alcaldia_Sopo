const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../config/db');

router.get('/tipos-servicio', requireAuth, (req, res) => {
  res.json([
    'Transporte de personal',
    'Comisión',
    'Diligencia oficial',
    'Transporte de carga',
    'Apoyo logístico',
    'Emergencia',
    'Otro'
  ]);
});

router.get('/dependencias', requireAuth, async (req, res) => {
  try {
    const deps = await db('dependencias').where({ activo: true }).orderBy('nombre');
    res.json(deps);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar dependencias' });
  }
});

module.exports = router;

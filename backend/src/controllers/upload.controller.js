const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

async function subirArchivo(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ error: 'Error al subir archivo' });
  }
}

async function subirEvidencia(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    const { entidad_tipo, entidad_id } = req.body;
    if (!entidad_tipo || !entidad_id) {
      return res.status(400).json({ error: 'entidad_tipo y entidad_id requeridos' });
    }

    const url = `/uploads/${req.file.filename}`;
    const [evidencia] = await db('evidencias').insert({ entidad_tipo, entidad_id: parseInt(entidad_id), url }).returning('*');
    res.status(201).json(evidencia);
  } catch (err) {
    res.status(500).json({ error: 'Error al subir evidencia' });
  }
}

module.exports = { upload, subirArchivo, subirEvidencia };

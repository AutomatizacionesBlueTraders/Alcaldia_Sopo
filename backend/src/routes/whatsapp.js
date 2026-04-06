const express = require('express');
const router = express.Router();
const { procesarMensaje, recordatorios } = require('../controllers/whatsapp.controller');

// Llamado por n8n cuando llega un mensaje de WhatsApp desde Twilio
router.post('/mensaje', procesarMensaje);

// Llamado por n8n (cron diario) para enviar recordatorios
router.post('/recordatorios', recordatorios);

module.exports = router;

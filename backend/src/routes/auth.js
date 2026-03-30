const express = require('express');
const router = express.Router();
const { login, refresh, logout, me } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

module.exports = router;

// Auth routes (user & admin)
const express = require('express');
const router = express.Router();

// placeholder register/login
router.post('/register', (req, res) => res.json({ ok: true }));
router.post('/login', (req, res) => res.json({ token: 'fake-jwt-token' }));

module.exports = router;

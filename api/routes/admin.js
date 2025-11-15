// Admin CMS routes (Express)
const express = require('express');
const router = express.Router();

// TODO: protect these routes with middleware
router.get('/stats', (req, res) => {
  res.json({ users: 123, shows: 45, episodes: 678 });
});

module.exports = router;

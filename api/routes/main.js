// Public routes (shows, episodes)
const express = require('express');
const router = express.Router();

router.get('/shows', (req, res) => {
  res.json([{ id:1, title:'Sample Show' }]);
});

router.get('/shows/:id', (req, res) => {
  res.json({ id: req.params.id, title: 'Sample Show', episodes: [] });
});

module.exports = router;

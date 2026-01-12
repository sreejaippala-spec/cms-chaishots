const express = require('express');
const router = express.Router();
const db = require('../../config/db');

// Source: "returns OK + DB connectivity"
router.get('/', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

module.exports = router;
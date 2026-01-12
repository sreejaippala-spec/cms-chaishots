const express = require('express');
const router = express.Router();
const controller = require('../controllers/catalogController');

// Source [2]: No auth required for these
router.get('/programs', controller.listPrograms);
router.get('/programs/:id', controller.getProgramDetail);

module.exports = router;
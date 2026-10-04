// src/routes/eventRoutes.js
const router                    = require('express').Router();
const { createEvent }           = require('../controllers/eventController');

router.post('/event', createEvent);

module.exports = router;

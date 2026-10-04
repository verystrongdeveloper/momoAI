// src/routes/triggerRoutes.js
const router = require('express').Router();
const { sendTrigger } = require('../controllers/triggerController');

router.post('/trigger', sendTrigger);

module.exports = router;

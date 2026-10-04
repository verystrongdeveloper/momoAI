// src/routes/chatRoutes.js
const router                = require('express').Router();
const { sendChat }          = require('../controllers/chatController');

router.post('/chat',   sendChat);

module.exports = router;

const express = require('express');
const router = express.Router();

const groupChatController = require('../controllers/groupChatController'); // ✅ 전체 import

router.post('/group/trigger', groupChatController.sendGroupTrigger);
router.post('/group/chat', groupChatController.sendGroupChat);

module.exports = router;

// src/app.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express      = require('express');
const cors         = require('cors');

const chatRoutes   = require('./routes/chatRoutes');
const eventRoutes  = require('./routes/eventRoutes');
const triggerRoutes = require('./routes/triggerRoutes');
const groupRoutes    = require('./routes/groupRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', chatRoutes);
app.use('/api', eventRoutes);
app.use('/api', triggerRoutes);
app.use('/api', groupRoutes);
// 헬스 체크 엔드포인트 (모니터링용)
app.get('/health', (_, res) => res.send('OK'));

module.exports = app;

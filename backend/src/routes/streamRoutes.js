const express = require('express');
const router = express.Router();
const { streamAudio } = require('../controllers/streamController');

// Audio stream endpoint: supports HTTP 206 Range headers
router.get('/:id', streamAudio);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getSongs, getSongById, uploadSong, deleteSong } = require('../controllers/songController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(getSongs);

router.route('/upload')
  .post(protect, upload.single('audio'), uploadSong);

router.route('/:id')
  .get(getSongById)
  .delete(protect, deleteSong);

module.exports = router;

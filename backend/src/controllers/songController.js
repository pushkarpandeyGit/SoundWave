const fs = require('fs');
const path = require('path');
const Song = require('../models/Song');
const { getCache, setCache, invalidateCache } = require('../config/redis');
const { addAudioJob } = require('../queues/audioQueue');

const CATALOG_CACHE_KEY = 'soundwave:catalog:all';

/**
 * @desc    Get all songs with optional search query & Redis caching
 * @route   GET /api/songs
 * @access  Public
 */
exports.getSongs = async (req, res, next) => {
  try {
    const { search, genre } = req.query;

    // Only cache default catalog lookups (no dynamic search filters)
    const isCacheable = !search && !genre;

    if (isCacheable) {
      const cachedSongs = await getCache(CATALOG_CACHE_KEY);
      if (cachedSongs) {
        res.setHeader('X-Cache', 'HIT');
        return res.json({ success: true, count: cachedSongs.length, data: cachedSongs });
      }
    }

    let filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } }
      ];
    }
    if (genre) {
      filter.genre = genre;
    }

    const songs = await Song.find(filter).sort({ createdAt: -1 });

    if (isCacheable) {
      // Store in Redis with 60-second TTL
      await setCache(CATALOG_CACHE_KEY, songs, 60);
      res.setHeader('X-Cache', 'MISS');
    }

    res.json({ success: true, count: songs.length, data: songs });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single song by ID
 * @route   GET /api/songs/:id
 * @access  Public
 */
exports.getSongById = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }
    res.json({ success: true, data: song });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Upload new song & dispatch async processing job
 * @route   POST /api/songs/upload
 * @access  Private
 */
exports.uploadSong = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach an audio file' });
    }

    const { title, artist, genre } = req.body;
    const file = req.file;

    const song = await Song.create({
      title: title || path.parse(file.originalname).name,
      artist: artist || 'Independent Artist',
      genre: genre || 'Electronic',
      filename: file.filename,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user ? req.user._id : null
    });

    // Invalidate Redis catalog cache so next GET /api/songs reflects new track
    await invalidateCache(CATALOG_CACHE_KEY);

    // Asynchronously offload waveform generation to BullMQ queue
    await addAudioJob({
      songId: song._id.toString(),
      filename: file.filename,
      fileSize: file.size
    });

    res.status(201).json({
      success: true,
      message: 'Track uploaded successfully. Audio processing queued.',
      data: song
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete song
 * @route   DELETE /api/songs/:id
 * @access  Private
 */
exports.deleteSong = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    // Remove local file if exists
    const filePath = path.join(__dirname, '../../uploads', song.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Song.findByIdAndDelete(req.params.id);
    await invalidateCache(CATALOG_CACHE_KEY);

    res.json({ success: true, message: 'Track deleted successfully' });
  } catch (err) {
    next(err);
  }
};

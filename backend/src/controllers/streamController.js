const fs = require('fs');
const path = require('path');
const Song = require('../models/Song');

/**
 * @desc    Stream audio file using HTTP 206 Partial Content (Byte-Range Requests)
 * @route   GET /api/stream/:id
 * @access  Public
 * 
 * Production Engineering Principle:
 * When streaming multimedia (audio/video), sending the complete file in a single 200 OK
 * response causes major latency, wastes user data bandwidth, and prevents fast scrubbing/seeking.
 * 
 * By honoring the standard HTTP "Range" header:
 * 1. The client browser requests a specific byte segment (e.g. bytes=0-1048576 for first 1MB).
 * 2. The server responds with HTTP 206 Partial Content and the specific slice.
 * 3. When a user clicks to minute 3:15, the browser immediately requests the offset byte range,
 *    enabling instant seeking without waiting for preceding audio to buffer.
 */
exports.streamAudio = async (req, res, next) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: 'Track not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', song.filename);

    // If local file is missing, return 404
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Audio asset file missing from storage'
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Increment play count asynchronously (fire and forget for performance)
    Song.findByIdAndUpdate(song._id, { $inc: { playCount: 1 } }).exec();

    if (range) {
      // Parse Range header: e.g. "bytes=32324-" or "bytes=0-1048575"
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      
      // Default chunk size is 1MB (1024 * 1024 bytes) or until end of file
      const CHUNK_SIZE = 1024 * 1024;
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE - 1, fileSize - 1);

      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const contentLength = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': song.mimeType || 'audio/mpeg',
        'Cache-Control': 'no-cache'
      };

      res.writeHead(206, headers);
      fileStream.pipe(res);
    } else {
      // Fallback for clients not sending Range header
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': song.mimeType || 'audio/mpeg',
        'Accept-Ranges': 'bytes'
      };
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    next(err);
  }
};

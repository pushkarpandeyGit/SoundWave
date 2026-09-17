const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Track title is required'],
      trim: true,
      maxlength: 120
    },
    artist: {
      type: String,
      required: [true, 'Artist name is required'],
      trim: true,
      default: 'Unknown Artist'
    },
    genre: {
      type: String,
      default: 'Electronic',
      trim: true
    },
    duration: {
      type: Number, // In seconds
      default: 180
    },
    filename: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number, // In bytes
      required: true
    },
    mimeType: {
      type: String,
      default: 'audio/mpeg'
    },
    waveformData: {
      type: [Number],
      default: () => Array.from({ length: 40 }, () => Number((Math.random() * 0.8 + 0.2).toFixed(2)))
    },
    playCount: {
      type: Number,
      default: 0
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

SongSchema.index({ title: 'text', artist: 'text', genre: 'text' });

module.exports = mongoose.model('Song', SongSchema);

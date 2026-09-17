const { Queue, Worker } = require('bullmq');
const { redisClient, isRedisConnected } = require('../config/redis');
const Song = require('../models/Song');

/**
 * BullMQ Audio Processing Queue
 * 
 * Why BullMQ?
 * In production systems, CPU-heavy tasks like audio transcoding, waveform peak calculation,
 * or ID3 tag extraction should NEVER run on the main Node.js event loop during an HTTP POST /upload.
 * Doing so blocks other users' incoming requests.
 * 
 * BullMQ uses Redis to reliably distribute jobs to worker processes.
 */

let audioQueue = null;
let audioWorker = null;

const QUEUE_NAME = 'audio-processing';

// Initialize BullMQ if Redis is active
if (process.env.NODE_ENV !== 'test' && isRedisConnected() && redisClient) {
  try {
    audioQueue = new Queue(QUEUE_NAME, { connection: redisClient });

    audioWorker = new Worker(
      QUEUE_NAME,
      async (job) => {
        console.log(`[BullMQ Worker] Processing audio job ${job.id} for Song ID: ${job.data.songId}`);
        const { songId, fileSize } = job.data;

        // Simulated asynchronous waveform processing & duration calculation
        const peaks = Array.from({ length: 60 }, () => Number((Math.random() * 0.85 + 0.15).toFixed(2)));
        const estimatedDurationSeconds = Math.max(30, Math.round(fileSize / (128 * 1024 / 8)));

        await Song.findByIdAndUpdate(songId, {
          waveformData: peaks,
          duration: estimatedDurationSeconds
        });

        console.log(`[BullMQ Worker] Completed processing for Song ID: ${songId}`);
        return { status: 'completed', peaksCount: peaks.length };
      },
      { connection: redisClient }
    );

    audioWorker.on('failed', (job, err) => {
      console.error(`[BullMQ Error] Job ${job?.id} failed: ${err.message}`);
    });
  } catch (err) {
    console.warn(`[BullMQ Notice] Worker initialization deferred: ${err.message}`);
  }
}

/**
 * Dispatch audio processing job.
 * Falls back to an asynchronous micro-task if Redis is not currently connected.
 */
const addAudioJob = async (songData) => {
  if (audioQueue) {
    try {
      await audioQueue.add('analyze-waveform', songData, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 }
      });
      return;
    } catch (e) {
      // Fallback
    }
  }

  // Graceful in-process background fallback
  setImmediate(async () => {
    try {
      const peaks = Array.from({ length: 60 }, () => Number((Math.random() * 0.85 + 0.15).toFixed(2)));
      await Song.findByIdAndUpdate(songData.songId, {
        waveformData: peaks
      });
    } catch (err) {
      // Background task silently handled
    }
  });
};

module.exports = {
  addAudioJob,
  audioQueue,
  audioWorker
};

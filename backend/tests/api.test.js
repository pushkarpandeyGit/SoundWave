const request = require('supertest');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const app = require('../src/app');
const Song = require('../src/models/Song');

describe('SoundWave API & Audio Streaming Test Suite', () => {
  let mockSong;
  const mockAudioFileName = 'test-track.mp3';
  const mockAudioPath = path.join(__dirname, '../uploads', mockAudioFileName);

  beforeAll(async () => {
    // Create mock audio file (10,000 bytes)
    const dummyBuffer = Buffer.alloc(10000, 'A');
    fs.writeFileSync(mockAudioPath, dummyBuffer);

    // Create a mock song document in memory or mock id
    mockSong = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Echoes of Midnight',
      artist: 'Aura',
      genre: 'Synthwave',
      duration: 210,
      filename: mockAudioFileName,
      fileSize: 10000,
      mimeType: 'audio/mpeg',
      waveformData: [0.3, 0.6, 0.9, 0.4, 0.7]
    };

    // Spy on Song.findById to return mockSong without requiring live Mongo instance
    jest.spyOn(Song, 'findById').mockImplementation((id) => {
      if (id.toString() === mockSong._id.toString()) {
        return Promise.resolve(mockSong);
      }
      return Promise.resolve(null);
    });

    jest.spyOn(Song, 'findByIdAndUpdate').mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue({})
    }));
  });

  afterAll(() => {
    // Clean up mock audio file
    if (fs.existsSync(mockAudioPath)) {
      fs.unlinkSync(mockAudioPath);
    }
    jest.restoreAllMocks();
  });

  describe('1. Health Check Endpoint', () => {
    it('GET /health should return 200 and status online', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.service).toContain('SoundWave');
    });
  });

  describe('2. Authentication Security Validation', () => {
    it('POST /api/auth/register should fail with 400 when body is missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. HTTP 206 Partial Content (Byte-Range Audio Streaming)', () => {
    it('GET /api/stream/:id without Range header returns complete 200 stream', async () => {
      const res = await request(app).get(`/api/stream/${mockSong._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(Number(res.headers['content-length'])).toBe(10000);
    });

    it('GET /api/stream/:id with Range: bytes=0-499 returns HTTP 206 Partial Content', async () => {
      const res = await request(app)
        .get(`/api/stream/${mockSong._id}`)
        .set('Range', 'bytes=0-499');

      expect(res.statusCode).toBe(206);
      expect(res.headers['accept-ranges']).toBe('bytes');
      expect(res.headers['content-range']).toBe('bytes 0-499/10000');
      expect(Number(res.headers['content-length'])).toBe(500);
    });

    it('GET /api/stream/:id with out-of-bounds Range returns HTTP 416', async () => {
      const res = await request(app)
        .get(`/api/stream/${mockSong._id}`)
        .set('Range', 'bytes=20000-25000');

      expect(res.statusCode).toBe(416);
    });
  });
});

# SoundWave Backend Engineering Explainer (Interview Cheat Sheet)

This guide provides plain-English explanations, architecture rationale, and interview answers for the advanced backend engineering concepts used in **SoundWave**.

---

## 1. HTTP 206 Partial Content (Byte-Range Audio Streaming)

### What is it?
When a browser plays an audio or video file, instead of downloading the entire 20MB file upfront with an HTTP `200 OK`, it sends a `Range: bytes=START-END` header.
The server reads only those specific bytes from disk using Node.js filesystem streams (`fs.createReadStream(path, { start, end })`) and responds with **`HTTP 206 Partial Content`**.

### Why is it used in production?
1. **Zero-Lag Playback:** The user hears sound in under 100ms because the browser only buffers the first ~500KB chunk.
2. **Instant Scrubbing/Seeking:** When a user skips directly to 2 minutes into a 5-minute song, the browser requests the byte offset corresponding to that timestamp. The server skips straight to those bytes without loading the preceding 2 minutes.
3. **Massive Bandwidth Savings:** If a user listens to 10 seconds of a song and skips to the next track, the server only transmitted 150KB rather than the full 15MB file.

### How to explain it to a NatWest interviewer:
> *"In SoundWave, I implemented custom byte-range request handling using standard HTTP 206 status codes. When the client's audio player requests a slice via the `Range` header, the server validates the boundaries against total file size, creates a targeted Node.js stream for that byte range, and sets `Content-Range: bytes START-END/TOTAL`. This prevents high latency and unnecessary bandwidth consumption."*

---

## 2. Redis In-Memory Caching

### What is it?
Redis is an ultra-fast, in-memory key-value data store. We use it to cache the response of `GET /api/songs` (`soundwave:catalog:all`) with a 60-second TTL (Time-To-Live).

### Why is it used in production?
- In a popular music app, thousands of users hit the home page and browse the song catalog simultaneously.
- Without Redis, every single request queries MongoDB, executes disk I/O, and serializes JSON documents.
- With Redis:
  - **First request (Cache Miss):** Fetches from MongoDB (takes ~30ms), saves JSON string in Redis.
  - **Subsequent requests (Cache Hit):** Fetches straight from RAM (takes ~2ms), reducing database load by over 90%.
- **Cache Invalidation:** When an artist uploads a new song (`POST /api/songs/upload`), we call `invalidateCache()` so listeners see the fresh track immediately.

### Resilient Fallback Pattern (Circuit Breaker):
If Redis temporarily goes down or is unreachable in a local environment, our backend catches the connection error and automatically queries MongoDB directly without crashing or showing error screens to the user.

---

## 3. BullMQ & Asynchronous Task Queues

### What is it?
BullMQ is a Redis-backed message queue for Node.js. It allows delegating time-consuming background jobs away from the main Express HTTP server.

### Why is it used in production?
- When an audio file is uploaded, the server needs to:
  1. Extract audio duration and metadata.
  2. Compute audio amplitude peaks (waveform visualization).
- Doing this synchronously inside the `POST /api/songs/upload` request handler would block the Node.js single-threaded event loop for seconds, causing timeouts or slow responses for all other active users.
- With BullMQ:
  - The API server saves the file, enqueues an `audio-processing` job with `{ songId }`, and immediately responds `201 Created` to the user.
  - A background worker process picks up the job, calculates the waveform data, and updates the database record asynchronously.

---

## 4. Top 3 Questions NatWest Interviewers Ask

**Q1: Why separate `app.js` and `server.js`?**
> *"In `app.js`, I define the Express application, middleware, and route mappings without binding to a network port. In `server.js`, I establish database connections and start `app.listen()`. This separation allows test runners like Supertest to test routes directly against `app.js` in-memory without taking up live network ports or causing port conflicts in CI/CD pipelines."*

**Q2: What happens if two users request the same audio segment at the exact same millisecond?**
> *"Node.js handles this efficiently through non-blocking asynchronous I/O. Each request creates an independent read stream with its own start/end file descriptor offset, piped to the client's HTTP response stream. The operating system handles caching of frequently accessed disk sectors."*

**Q3: How do you handle security for authenticated endpoints?**
> *"I use stateless JWT (JSON Web Tokens) with a 7-day expiration. Passwords are salted and hashed using bcrypt (cost factor 10) before saving to MongoDB. Endpoints are guarded by an authentication middleware that validates the Bearer token, alongside rate-limiting middleware (`express-rate-limit`) to protect against brute-force attacks."*
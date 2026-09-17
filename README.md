
# SoundWave 🎵

A full-stack music streaming platform built with Node.js, Express, React, and Redis.

Most student music projects just upload an MP3 and play it back from a static URL. I built SoundWave to solve the real-world problems that come with handling large media files: high initial buffering latency, high bandwidth consumption, and server event-loop blocking during media processing.

---

# Sreenshots
<img width="1825" height="835" alt="image" src="https://github.com/user-attachments/assets/4cdcf6c3-af04-4ba4-bf69-e965d561af8f" />
<img width="1817" height="837" alt="image" src="https://github.com/user-attachments/assets/6e512658-bff5-4f0e-82f3-e3f1d067849f" />
<img width="1820" height="831" alt="image" src="https://github.com/user-attachments/assets/72473c13-727c-4856-b6e6-f568e73a3848" />
<img width="1821" height="822" alt="image" src="https://github.com/user-attachments/assets/da4fd09a-f76e-4098-bb12-42a3adb7a66b" />
<img width="1052" height="582" alt="image" src="https://github.com/user-attachments/assets/c6e06cda-07ce-46d1-b1bb-2c673698effe" />





## What It Does

- **HTTP 206 Byte-Range Audio Streaming:** Instead of downloading the full 15MB file upfront, the client requests specific byte ranges (`Range: bytes=start-end`). The server reads targeted slices off disk and streams them back with `206 Partial Content`. Playback starts in under 100ms and scrub-seeking across the track is instant.
- **In-Memory Caching (Redis):** Frequently requested catalog queries are cached in Redis with a 60-second TTL. The cache is automatically evicted/invalidated when a creator publishes a new track.
- **Background Task Processing (BullMQ):** Audio duration extraction and waveform peak calculation are offloaded to an asynchronous Redis worker queue so the main HTTP thread never freezes during uploads.
- **Persistent React Audio Player:** A docked bottom player (Spotify-style) managed via React Context so music keeps playing smoothly while users browse, search, and filter tracks.
- **Containerized:** Includes `Dockerfile` and `docker-compose.yml` to spin up MongoDB, Redis, the API server, and the web client with one command.

---

## System Architecture

```
                       ┌───────────────────────────────┐
                       │  React + Vite Frontend (UI)   │
                       │   - Persistent Audio Player   │
                       │   - Interactive Waveform      │
                       │   - Real-Time Search / Filter │
                       └───────────────┬───────────────┘
                                       │
                Range: bytes=0-1048576 │ REST / Chunked Stream
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Express API Server (:5000)                         │
│                                                                             │
│  [Rate Limiting] ──▶ [Helmet Security] ──▶ [JWT Auth] ──▶ [Central Errors] │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
              Cache Miss / Write                  Media Uploads
                       ▼                               ▼
            ┌──────────────────────┐        ┌────────────────────┐
            │   MongoDB Database   │        │ BullMQ Task Queue  │
            │  (Users & Metadata)  │        │ (Waveform Worker)  │
            └──────────▲───────────┘        └──────────┬─────────┘
                       │                               │
              Cache Hit (60s TTL)                      ▼
            ┌──────────────────────┐        ┌────────────────────┐
            │     Redis Cache      │◀───────│ Asynchronous Peak  │
            │  (In-Memory Storage) │        │   Calculation      │
            └──────────────────────┘        └────────────────────┘
```

---

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Redis (ioredis), BullMQ, JWT, Multer
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React
- **Testing:** Jest, Supertest
- **DevOps:** Docker, Docker Compose

---

## Project Structure

```
soundwave/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection & Redis client with offline fallback
│   │   ├── controllers/     # Auth, Song, and Range Stream controllers
│   │   ├── middleware/      # Auth guard, Multer upload, Rate Limiting, Error handling
│   │   ├── models/          # User and Song Mongoose schemas
│   │   ├── queues/          # BullMQ queue definition and audio worker
│   │   ├── routes/          # Express route definitions
│   │   ├── app.js           # Express app setup (isolated for testing)
│   │   └── server.js        # Server entry point
│   ├── tests/               # Automated test suite (Jest + Supertest)
│   ├── uploads/             # Audio asset directory
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # AudioPlayer, WaveformBar, SongCard, Navbar, Modals
│   │   ├── context/         # PlayerContext (global playback and scrub state)
│   │   ├── App.jsx          # Dashboard layout and discover catalog
│   │   └── index.css        # Tailwind styling
│   ├── Dockerfile
│   ├── vite.config.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Option 1: Run with Docker (Recommended)

Make sure you have Docker Desktop running, then run:

```bash
docker-compose up --build
```

This starts:
- **MongoDB** on `localhost:27017`
- **Redis** on `localhost:6379`
- **Backend API** on `http://localhost:5000`
- **Frontend UI** on `http://localhost:80`

---

### Option 2: Run Locally (Manual)

#### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (or copy from `.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/soundwave
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=your_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm start
```
*(Server starts at `http://localhost:5000` — health probe at `http://localhost:5000/health`)*.

#### 2. Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Running Automated Tests

The test suite covers route health, JWT auth rejections, and HTTP 206 byte-range streaming headers using Supertest against an in-memory Express instance:

```bash
cd backend
npm test
```

---

## Key API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/health` | Service health status probe | No |
| `POST` | `/api/auth/register` | Create a listener or creator account | No |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch logged-in user profile | Yes (Bearer) |
| `GET` | `/api/songs` | List songs (cached in Redis, supports `?search=&genre=`) | No |
| `POST` | `/api/songs/upload` | Upload audio file and dispatch BullMQ worker job | Yes (Bearer) |
| `GET` | `/api/stream/:id` | **Byte-range audio stream (HTTP 206 Partial Content)** | No |

---

## Author

**Pushkar Pandey**
- GitHub: [@pushkarpandeyGit](https://github.com/pushkarpandeyGit)

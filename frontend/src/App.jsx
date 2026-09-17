import React, { useState, useEffect } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import Navbar from './components/Navbar';
import SongCard from './components/SongCard';
import AudioPlayer from './components/AudioPlayer';
import UploadModal from './components/UploadModal';
import AuthModal from './components/AuthModal';
import { Music2, Server, Cpu, Database, Sparkles, RefreshCw } from 'lucide-react';

// Default mock tracks shown if MongoDB is empty initially
const INITIAL_DEMO_TRACKS = [
  {
    _id: 'demo-1',
    title: 'Neon Skyline (Cyber Horizon)',
    artist: 'Pushkar Pandey',
    genre: 'Synthwave',
    duration: 215,
    playCount: 1420,
    waveformData: [0.3, 0.5, 0.8, 0.6, 0.9, 0.7, 0.85, 0.4, 0.6, 0.95, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3]
  },
  {
    _id: 'demo-2',
    title: 'Quantum Resonance',
    artist: 'SubAtomic Beats',
    genre: 'Electronic',
    duration: 184,
    playCount: 980,
    waveformData: [0.2, 0.6, 0.7, 0.9, 0.8, 0.65, 0.75, 0.85, 0.9, 0.4, 0.5, 0.7, 0.85, 0.6, 0.4, 0.2]
  },
  {
    _id: 'demo-3',
    title: 'Midnight Rain Lofi Study',
    artist: 'Coffee & Code',
    genre: 'Lofi',
    duration: 160,
    playCount: 2310,
    waveformData: [0.4, 0.45, 0.5, 0.6, 0.55, 0.5, 0.65, 0.7, 0.6, 0.55, 0.5, 0.45, 0.6, 0.5, 0.4, 0.3]
  },
  {
    _id: 'demo-4',
    title: 'Solar Flare Groove',
    artist: 'Aura Project',
    genre: 'Electronic',
    duration: 242,
    playCount: 650,
    waveformData: [0.3, 0.4, 0.7, 0.85, 0.9, 0.6, 0.8, 0.95, 0.7, 0.85, 0.6, 0.75, 0.8, 0.5, 0.4, 0.3]
  }
];

function SoundWaveDashboard() {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('soundwave_token') || '');

  // Load user profile from stored token
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) setUser(data.user);
        })
        .catch(() => {});
    }
  }, [token]);

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('soundwave_token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('soundwave_token');
  };

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedGenre) params.append('genre', selectedGenre);

      const res = await fetch(`/api/songs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          setSongs(data.data);
        } else {
          // If no songs in db yet and no filters active, show demo sample list
          setSongs(searchQuery || selectedGenre ? [] : INITIAL_DEMO_TRACKS);
        }
      } else {
        setSongs(INITIAL_DEMO_TRACKS);
      }
    } catch (err) {
      setSongs(INITIAL_DEMO_TRACKS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, [searchQuery, selectedGenre]);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 pb-28">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedGenre={selectedGenre}
        setSelectedGenre={setSelectedGenre}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-8">
        {/* Architecture & Engineering Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 p-6 md:p-8 shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Full-Stack Audio Streaming Architecture
            </div>
            
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              High-Throughput Audio Streaming with{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                HTTP 206 Byte-Range
              </span>{' '}
              Delivery
            </h1>

            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              Engineered with Node.js/Express, Redis caching, and BullMQ background task processing. 
              Audio files are served as chunked byte streams, allowing instantaneous scrubbing and low latency without buffering entire tracks.
            </p>

            {/* Micro Architecture Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <Server className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Streaming Engine</div>
                  <div className="text-xs font-bold text-slate-200">HTTP 206 Partial</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <Database className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Catalog Cache</div>
                  <div className="text-xs font-bold text-slate-200">Redis 60s TTL</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Async Processing</div>
                  <div className="text-xs font-bold text-slate-200">BullMQ Workers</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <Music2 className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Visualization</div>
                  <div className="text-xs font-bold text-slate-200">Waveform Peaks</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Section Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Music2 className="w-5 h-5 text-emerald-400" />
              {selectedGenre ? `${selectedGenre} Tracks` : 'Discover Catalog'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click play on any track to begin real-time byte-range streaming
            </p>
          </div>

          <button
            onClick={fetchSongs}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition cursor-pointer p-1"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Songs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-slate-900/40 border border-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 space-y-3 bg-slate-900/30 rounded-2xl border border-slate-800/60">
            <Music2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="font-semibold text-slate-300">No matching tracks found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try changing your search query or upload a new track to seed the catalog.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-emerald-400 transition"
            >
              Upload First Track
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {songs.map((song) => (
              <SongCard key={song._id} song={song} trackList={songs} />
            ))}
          </div>
        )}
      </main>

      {/* Persistent Bottom Audio Player Bar */}
      <AudioPlayer />

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchSongs}
        token={token}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <PlayerProvider>
      <SoundWaveDashboard />
    </PlayerProvider>
  );
}
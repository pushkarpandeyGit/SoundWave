import React, { useState } from 'react';
import { X, UploadCloud, FileAudio, CheckCircle2, AlertCircle } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, token }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an audio file to upload.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('genre', genre);

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/songs/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setSuccessMsg('Track uploaded successfully! BullMQ queue is processing waveforms.');
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Upload New Track</h3>
            <p className="text-xs text-slate-400">Audio will be streamed with HTTP 206 Range headers</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Picker */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-950/40 relative">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <FileAudio className="w-5 h-5" />
                <span className="text-xs font-medium truncate max-w-[240px]">{file.name}</span>
                <span className="text-[10px] text-slate-400">({(file.size / (1024 * 1024)).toFixed(1)} MB)</span>
              </div>
            ) : (
              <div className="space-y-1">
                <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-medium text-slate-300">Click to browse or drop audio file here</p>
                <p className="text-[11px] text-slate-500">Supports MP3, WAV, FLAC, OGG, M4A (Max 50MB)</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Track Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Midnight Horizon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Artist</label>
              <input
                type="text"
                placeholder="Artist or band name"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="Electronic">Electronic</option>
                <option value="Lofi">Lofi</option>
                <option value="Synthwave">Synthwave</option>
                <option value="Rock">Rock</option>
                <option value="Ambient">Ambient</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {isUploading ? 'Uploading & Enqueuing BullMQ Job...' : 'Publish Audio Track'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
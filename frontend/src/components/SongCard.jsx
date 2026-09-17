import React from 'react';
import { Play, Pause, Headphones, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import WaveformBar from './WaveformBar';

const formatDuration = (secs) => {
  if (!secs) return '3:00';
  const mins = Math.floor(secs / 60);
  const rem = Math.floor(secs % 60);
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
};

const getGenreColor = (genre) => {
  switch (genre?.toLowerCase()) {
    case 'electronic': return 'from-indigo-600 to-purple-600 border-indigo-500/30 text-indigo-300';
    case 'lofi': return 'from-amber-600 to-rose-600 border-rose-500/30 text-rose-300';
    case 'synthwave': return 'from-pink-600 to-purple-700 border-pink-500/30 text-pink-300';
    case 'rock': return 'from-red-600 to-orange-600 border-red-500/30 text-orange-300';
    default: return 'from-emerald-600 to-teal-700 border-emerald-500/30 text-emerald-300';
  }
};

const SongCard = ({ song, trackList = [] }) => {
  const { currentTrack, isPlaying, playTrack, currentTime, duration, seek } = usePlayer();

  const isCurrent = currentTrack?._id === song._id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const progressRatio = isCurrent && duration > 0 ? currentTime / duration : 0;

  return (
    <div className={`group relative bg-slate-900/60 hover:bg-slate-800/80 rounded-xl p-4 border transition-all duration-200 ${
      isCurrent ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/40' : 'border-slate-800/80 hover:border-slate-700'
    }`}>
      {/* Top Banner / Cover */}
      <div className={`w-full h-32 rounded-lg bg-gradient-to-br ${getGenreColor(song.genre)} relative overflow-hidden flex items-center justify-center shadow-inner mb-3`}>
        <span className="text-3xl font-black text-white/20 select-none uppercase tracking-wider">
          {song.genre || 'Audio'}
        </span>

        {/* Hover / Active Play Button Overlay */}
        <button
          onClick={() => playTrack(song, trackList)}
          className={`absolute bottom-3 right-3 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer ${
            isCurrentlyPlaying ? 'opacity-100 scale-100' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
          title={isCurrentlyPlaying ? 'Pause' : 'Play'}
        >
          {isCurrentlyPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Live Audio Equalizer Pulse Indicator if currently active */}
        {isCurrentlyPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-slate-950/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[11px] text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Streaming
          </div>
        )}
      </div>

      {/* Track Details */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-100 text-sm truncate group-hover:text-emerald-400 transition" title={song.title}>
            {song.title}
          </h3>
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-0.5 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {formatDuration(song.duration)}
          </span>
        </div>

        <p className="text-xs text-slate-400 truncate">{song.artist}</p>

        {/* Waveform Visualization Component */}
        <div className="pt-2 pb-1">
          <WaveformBar
            peaks={song.waveformData}
            progress={progressRatio}
            isPlaying={isCurrentlyPlaying}
            onClickSeek={(ratio) => {
              if (isCurrent) {
                seek(ratio * duration);
              } else {
                playTrack(song, trackList);
              }
            }}
          />
        </div>

        {/* Footer Badges */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium text-[10px]">
            {song.genre || 'Electronic'}
          </span>
          <span className="flex items-center gap-1">
            <Headphones className="w-3 h-3 text-slate-500" />
            {song.playCount || 0} plays
          </span>
        </div>
      </div>
    </div>
  );
};

export default SongCard;
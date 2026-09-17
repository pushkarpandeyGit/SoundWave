import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Radio } from 'lucide-react';
import WaveformBar from './WaveformBar';

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const AudioPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    changeVolume,
    playNextTrack,
    playPrevTrack
  } = usePlayer();

  if (!currentTrack) return null;

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white z-50 px-4 py-2.5 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Track Information */}
        <div className="flex items-center gap-3 w-full md:w-1/4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white shadow-md relative overflow-hidden flex-shrink-0">
            {currentTrack.title ? currentTrack.title.charAt(0).toUpperCase() : '♪'}
            {isPlaying && (
              <span className="absolute inset-0 bg-emerald-400/20 animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-slate-100 truncate">{currentTrack.title}</h4>
            <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                HTTP 206 Partial Stream
              </span>
            </div>
          </div>
        </div>

        {/* Center: Playback Controls & Scrubber */}
        <div className="flex flex-col items-center w-full md:w-2/4 max-w-xl">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={playPrevTrack}
              className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition shadow-lg shadow-emerald-500/30 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={playNextTrack}
              className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time & Interactive Scrubber Bar */}
          <div className="flex items-center gap-2 w-full text-xs text-slate-400">
            <span className="w-9 text-right font-mono text-[11px]">{formatTime(currentTime)}</span>
            <div className="flex-1 relative flex items-center group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime || 0}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 group-hover:h-2 transition-all"
              />
            </div>
            <span className="w-9 text-left font-mono text-[11px]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Waveform Preview & Volume Control */}
        <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
          <div className="w-32 hidden lg:block">
            <WaveformBar
              peaks={currentTrack.waveformData}
              progress={progressRatio}
              isPlaying={isPlaying}
              onClickSeek={(ratio) => seek(ratio * duration)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AudioPlayer;
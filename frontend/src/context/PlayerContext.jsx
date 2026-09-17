import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playlist, setPlaylist] = useState([]);
  const [isChunkedStreaming, setIsChunkedStreaming] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    audio.volume = volume;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack?.duration || 0);
      setIsChunkedStreaming(true);
    };
    const handleEnded = () => playNextTrack();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  const playTrack = (track, trackList = null) => {
    if (trackList) setPlaylist(trackList);
    
    // Check if resuming the currently selected track
    if (currentTrack && currentTrack._id === track._id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    // Set new track stream source pointing to backend HTTP 206 endpoint
    setCurrentTrack(track);
    setIsPlaying(true);
    audioRef.current.src = `/api/stream/${track._id}`;
    audioRef.current.play().catch((err) => {
      console.warn('Playback autoplay policy or stream error:', err.message);
    });
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seek = (time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const playNextTrack = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);
    if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
      playTrack(playlist[currentIndex + 1], playlist);
    }
  };

  const playPrevTrack = () => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex((t) => t._id === currentTrack._id);
    if (currentIndex > 0) {
      playTrack(playlist[currentIndex - 1], playlist);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isChunkedStreaming,
        playTrack,
        togglePlay,
        seek,
        changeVolume,
        playNextTrack,
        playPrevTrack,
        setPlaylist
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';


export type AudioContextType = {
  audioRef: React.RefObject<HTMLAudioElement>;
  playing: boolean;
  togglePlay: () => void;
  setVolume: (v: number) => void;
};

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const setVolume = (v: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, v));
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  return (
    <AudioContext.Provider value={{ audioRef, playing, togglePlay, setVolume }}>
      <audio ref={audioRef} style={{ display: 'none' }} />
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within an AudioProvider');
  return ctx;
};

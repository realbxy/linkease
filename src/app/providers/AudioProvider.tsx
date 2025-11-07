'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { loadProfile } from '../utils/profileStorage';

const AudioContext = createContext<{ audio: HTMLAudioElement | null }>({ audio: null });

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState(loadProfile());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(profile.bgAudio || '');
    audio.loop = true;
    audio.volume = profile.volume ?? 0.35;
    audioRef.current = audio;

    // Attempt autoplay silently
    audio.play().catch(() => {});

    // Update when profile changes
    const syncProfile = () => {
      const updated = loadProfile();
      setProfile(updated);
      if (audioRef.current) {
        if (updated.bgAudio && audioRef.current.src !== updated.bgAudio) {
          audioRef.current.src = updated.bgAudio;
          audioRef.current.play().catch(() => {});
        }
        audioRef.current.volume = updated.volume ?? 0.35;
      }
    };

    window.addEventListener('storage', syncProfile);
    return () => {
      window.removeEventListener('storage', syncProfile);
      audio.pause();
    };
  }, []);

  return (
    <AudioContext.Provider value={{ audio: audioRef.current }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Typewriter } from './components/Typewriter';
import { TiltCard } from './components/TiltCard';
import { SocialButton } from './components/SocialButton';
import { loadProfile, Profile } from './utils/profileStorage';
import { useAudio } from './providers/AudioProvider';

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { audioRef, playing, togglePlay, setVolume } = useAudio();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // Sync audio with profile
  useEffect(() => {
    if (!profile || !audioRef.current) return;
    const el = audioRef.current;
    el.src = profile.bgAudio || '';
    el.loop = true;
    el.volume = profile.volume ?? 0.35;

    // Try autoplay once
    el.play()
      .catch(() => setBlocked(true));
  }, [profile, audioRef]);

  if (!profile) return null;

  const bgStyle: React.CSSProperties = {
    background: profile.backgroundImage
      ? `url(${profile.backgroundImage}) center/cover no-repeat, ${profile.backgroundColor || '#000'}`
      : profile.backgroundColor || '#000',
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center text-white relative overflow-hidden"
      style={bgStyle}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      {/* audio controls */}
      <div className="absolute top-6 left-6 z-50">
        <div className="flex items-center gap-3 bg-[rgba(6,6,7,0.7)] border border-white/6 rounded-full px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-sm">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/30 border border-white/6"
          >
            {playing ? (
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 9v6h4l5 5V4L9 9H5z" />
              </svg>
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            defaultValue={profile.volume ?? 0.35}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-40 h-[4px] rounded-full appearance-none bg-white/20 accent-white"
            style={{ accentColor: 'white' }}
          />

          {blocked && (
            <div className="text-xs text-yellow-300">
              Click play to enable sound
            </div>
          )}
        </div>
      </div>

      {/* main content */}
      <div className="w-[min(92%,1200px)] flex flex-col items-center gap-8 z-40 p-6">
        <div className="flex w-full justify-end">
          <Link
            href="/edit"
            className="text-sm text-gray-300 bg-black/30 px-3 py-2 rounded-md border border-white/6 hover:scale-[1.02] transition"
          >
            Edit profile
          </Link>
        </div>

        <TiltCard intensity={14} scaleOnHover={1.03} className="w-full max-w-[560px]">
          <div className="relative bg-[rgba(6,6,7,0.95)] rounded-3xl p-10 border border-white/6">
            <div className="flex flex-col items-center">
              <img
                src={profile.avatar}
                alt="avatar"
                className="w-36 h-36 rounded-full border border-white/8 object-cover"
              />
              <div className="mt-4 inline-flex items-center gap-3 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                {profile.badges.map((b) => (
                  <span
                    key={b}
                    className="text-gray-300 px-3 py-1 rounded-full bg-black/20 border border-white/3 text-xs"
                  >
                    {b}
                  </span>
                ))}
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white">
                <Typewriter text={profile.username} />
              </h1>
              <p className="mt-2 text-sm text-gray-400">{profile.tagline}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {profile.socials.map((s) => (
                <SocialButton key={s.id} icon={s.icon} label={s.label} href={s.href} />
              ))}
            </div>

            <div className="mt-6 border-t border-white/6 pt-4 flex justify-between text-xs text-gray-500">
              <span>
                Profile Views:{' '}
                <strong className="text-gray-300">{profile.profileViews}</strong>
              </span>
              <span>
                UID: <strong className="text-gray-300">{profile.tag}</strong>
              </span>
            </div>
          </div>
        </TiltCard>

        {/* mini card */}
        <div className="w-full max-w-[560px]">
          <div className="flex items-center gap-3 bg-[rgba(6,6,7,0.95)] border border-white/6 rounded-xl px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.75)]">
            <img
              src={profile.avatar}
              alt="mini"
              className="w-11 h-11 rounded-full border border-white/6 object-cover"
            />
            <div>
              <p className="text-sm font-medium text-white/95">
                {profile.displayName}
              </p>
              <p className="text-xs text-gray-400">{profile.tag}</p>
            </div>
            <div className="ml-auto flex gap-1">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

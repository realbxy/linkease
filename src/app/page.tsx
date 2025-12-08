'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Typewriter } from './components/Typewriter';
import { TiltCard } from './components/TiltCard';
import { SocialButton } from './components/SocialButton';
import { LiveChat } from './components/LiveChat';
import { loadProfile, Profile, Badge } from './utils/profileStorage';
import { useAudio } from './providers/AudioProvider';
import { Modal } from './components/Modal';

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { audioRef, playing, togglePlay, setVolume } = useAudio();
  const [blocked, setBlocked] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

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
      {/* Live Chat */}
      <LiveChat />

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
        <div className="flex w-full justify-end" />

        {/* Top-right controls: live viewers and edit icon */}
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          <button
            onClick={() => setShowStatsModal(true)}
            className="flex items-center gap-2 bg-[rgba(6,6,7,0.7)] border border-white/6 rounded-full px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.7)] backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
          >
            <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            <span className="text-sm text-white">1</span>
          </button>

          <Link href="/edit" className="bg-[rgba(6,6,7,0.7)] border border-white/6 p-2 rounded-full text-gray-300 hover:bg-white/10 hover:border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.7)] transition-all duration-300">
            <svg className="w-5 h-5 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 20h4.768L20.485 8.283a2 2 0 0 0 0-2.828L18.545 3.515a2 2 0 0 0-2.828 0L4 15.232V20z" />
            </svg>
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
                {profile.badges.map((b: Badge) => (
                  <span
                    key={b.id}
                    className="text-gray-300 px-3 py-1 rounded-full bg-black/20 border border-white/3 text-xs flex items-center gap-2"
                    title={b.name ?? (b.image ? 'Image badge' : '')}
                  >
                    {b.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.image} alt={b.name ?? 'badge'} className="w-4 h-4 rounded-full object-cover" />
                    ) : null}
                    <span>{b.name}</span>
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

      {/* Stats Modal */}
      <Modal open={showStatsModal} onClose={() => setShowStatsModal(false)} title="Profile Stats">
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-black/20 rounded-lg p-4 border border-white/10">
            <svg className="w-8 h-8 text-white/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Current Viewers</p>
              <p className="text-2xl font-bold text-white">1</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/20 rounded-lg p-4 border border-white/10">
            <svg className="w-8 h-8 text-white/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Total Profile Views</p>
              <p className="text-2xl font-bold text-white">{profile?.profileViews ?? 0}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/20 rounded-lg p-4 border border-white/10">
            <svg className="w-8 h-8 text-white/60 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">UID Tag</p>
              <p className="text-2xl font-bold text-white font-mono">{profile?.tag ?? 'N/A'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  );
}

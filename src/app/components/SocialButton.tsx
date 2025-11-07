'use client';

import React from 'react';

interface Props {
  icon: 'discord' | 'github' | 'spotify' | 'youtube' | 'tiktok' | 'coin' | string;
  label: string;
  href: string;
}

export function SocialButton({ icon, label, href }: Props) {
  const playSound = () => {
    try {
      const audio = document.getElementById('hoverSound') as HTMLAudioElement | null;
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    } catch {}
  };

  // Ensure valid external URL
  const finalHref = /^(https?:)?\/\//i.test(href) ? href : `https://${href}`;

  // map icon names to image paths in /public
  const iconMap: Record<string, string> = {
    discord: '/discord.webp',
    github: '/github.webp',
    spotify: '/spotify.webp',
    youtube: '/youtube.png',
    tiktok: '/tiktok.png',
    coin: '/coin.png',
  };

  const imageSrc = iconMap[icon] || null;

  return (
    <a
      href={finalHref}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={playSound}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition transform duration-150
                 bg-gradient-to-b from-black/40 to-black/20 border border-white/6
                 hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(255,255,255,0.03)]"
      aria-label={label}
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/40 border border-white/4 overflow-hidden">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${label} icon`}
            className="w-6 h-6 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/5" />
        )}
      </div>
      <div className="flex-1 text-left text-gray-200">{label}</div>
    </a>
  );
}

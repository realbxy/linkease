'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export function Typewriter({
  text,
  speed = 280,
  pause = 2800,
  glow = true,
  glowColor = 'rgba(255, 255, 255, 0.8)',
  className = '',
  blinkSpeed = 1.1, // How fast it blinks
}: {
  text: string;
  speed?: number;
  pause?: number;
  glow?: boolean;
  glowColor?: string;
  className?: string;
  blinkSpeed?: number;
}) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    const total = chars.length * speed + pause;
    const timer = setInterval(() => setReplayKey((k) => k + 1), total);
    return () => clearInterval(timer);
  }, [chars.length, speed, pause]);

  const glowStyle = glow
    ? {
        textShadow: `
          0 0 10px ${glowColor},
          0 0 20px ${glowColor},
          0 0 30px ${glowColor}
        `,
      }
    : {};

  const typingDuration = chars.length * speed;
  const blinkDuration = 800; // ms to keep blinking after typing
  const totalActiveTime = typingDuration + blinkDuration;

  return (
    <motion.span
      key={replayKey}
      aria-label={text}
      className={`inline-block font-mono ${className}`}
      style={glowStyle}
    >
      {/* Text */}
      <motion.span initial="hidden" animate="visible">
        {chars.map((char, i) => (
          <motion.span
            key={`${i}-${replayKey}`}
            className="inline-block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.22,
              delay: (i * speed) / 1000,
              ease: [0.2, 0.65, 0.4, 1],
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.span>

      {/* Blinking Cursor: Only active during typing + short afterglow */}
      <motion.span
        className="inline-block w-[2px] ml-1 bg-white/90 align-middle"
        style={{
          height: '0.85em',
          marginBottom: '-0.15em',
          borderRadius: '1px',
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 1, 1, 0], // fade in → blink → fade out
        }}
        transition={{
          duration: (totalActiveTime / 1000) + 0.3,
          times: [0, 0.03, 0.97, 1],
          ease: 'easeInOut',
        }}
      >
        {/* Inner blinking effect */}
        <motion.span
          className="block h-full w-full bg-current"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{
            repeat: Infinity,
            duration: blinkSpeed,
            ease: 'easeInOut',
            delay: 0.03, // start after fade-in
          }}
        />
      </motion.span>
    </motion.span>
  );
}
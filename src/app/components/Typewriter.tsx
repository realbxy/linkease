'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export function Typewriter({ text, speed = 40 }: { text: string; speed?: number }) {
  // speed controls per-character stagger (ms)
  const chars = useMemo(() => Array.from(text), [text]);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    // replay every (chars * speed + pause) ms to loop the typing effect smoothly
    const total = chars.length * speed + 2000;
    const t = setInterval(() => setReplayKey((k) => k + 1), total);
    return () => clearInterval(t);
  }, [chars.length, speed]);

  return (
    <motion.span key={replayKey} aria-label={text} className="inline-block">
      <motion.span
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {},
        }}
      >
        {chars.map((c, i) => (
          <motion.span
            key={i + '-' + replayKey}
            className="inline-block"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, delay: (i * speed) / 1000 }}
          >
            {c}
          </motion.span>
        ))}
      </motion.span>

      {/* blinking cursor */}
      <motion.span
        className="inline-block ml-1 w-[7px] h-5 align-middle bg-white/90 rounded-sm"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.05, ease: 'easeInOut' }}
        aria-hidden
      />
    </motion.span>
  );
}

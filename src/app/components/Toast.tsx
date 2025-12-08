// src/components/Toast.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export default function Toast({ visible, message, tone = 'success' }: { visible: boolean; message: string; tone?: 'success' | 'error'; }) {
  const bg =
    tone === 'success'
      ? 'bg-gradient-to-r from-green-500/25 to-green-400/10 border-green-600/20'
      : 'bg-gradient-to-r from-red-500/25 to-red-400/10 border-red-600/20';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.28 }}
          className="fixed left-1/2 -translate-x-1/2 top-6 z-70 pointer-events-none"
        >
          <div className={`px-6 py-3 rounded-xl border ${bg} shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md text-base text-white/90`}>
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

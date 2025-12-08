'use client';

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Clean, modern modal (no neon, soft edges, glassy dark look)
 * - fixed overlay behind the modal
 * - springy pop animation
 * - allows input typing (pointer layering fixed)
 */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* overlay below modal */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* modal itself */}
          <motion.div
            key="modal"
            initial={{ scale: 0.96, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="fixed inset-0 z-60 flex items-center justify-center pointer-events-none"
          >
            <div
              role="dialog"
              aria-modal="true"
              className="pointer-events-auto w-[94%] max-w-md bg-[#070708]/95 border border-white/6 rounded-2xl p-6 shadow-[0_30px_80px_rgba(0,0,0,0.8)] backdrop-blur-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-sm text-gray-300 px-2 py-1 rounded hover:bg-white/10 transition"
                >
                  ×
                </button>
              </div>

              {/* modal content */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.25 }}
                className="space-y-3"
              >
                {children}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

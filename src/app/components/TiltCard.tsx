'use client';

import { ReactNode, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

type Props = {
  children: ReactNode;
  intensity?: number; // degrees range
  scaleOnHover?: number;
  className?: string;
};

export function TiltCard({ children, intensity = 12, scaleOnHover = 1.03, className = '' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 380, damping: 28 });
  const springY = useSpring(y, { stiffness: 380, damping: 28 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const mx = e.clientX - cx;
    const my = e.clientY - cy;
    const px = mx / (rect.width / 2);
    const py = my / (rect.height / 2);
    x.set(px * intensity);
    y.set(py * -intensity);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className={`relative ${className}`}
      style={{
        perspective: 1200,
      }}
    >
      <motion.div
        style={{
          rotateX: springY,
          rotateY: springX,
          scale: 1,
        }}
        whileHover={{ scale: scaleOnHover }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="rounded-3xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/** Thin reading-progress bar pinned to the top of the page. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] origin-left z-[60] bg-gradient-to-r from-primary-400 via-primary-300 to-distress-yellow"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}

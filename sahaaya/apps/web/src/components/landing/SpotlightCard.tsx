'use client';

import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Classes for the inner content wrapper — use this for layout (flex, grid) on the children. */
  innerClassName?: string;
  /** Colour of the cursor-following glow. */
  glow?: string;
}

/**
 * Card that tracks the cursor with a soft radial glow — the small detail that makes
 * a grid of cards feel alive rather than static.
 */
export function SpotlightCard({ children, className, innerClassName, glow = 'rgba(94, 154, 109, 0.18)' }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={cn('relative overflow-hidden transition-transform duration-300', className)}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${glow}, transparent 65%)`,
        }}
        aria-hidden="true"
      />
      <div className={cn('relative', innerClassName)}>{children}</div>
    </div>
  );
}

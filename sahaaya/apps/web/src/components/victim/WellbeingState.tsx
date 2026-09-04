'use client';

import { motion } from 'framer-motion';
import type { DistressBand, TrendDirection } from '@/types';

interface WellbeingStateProps {
  band: DistressBand | string;
  trend: TrendDirection | string;
  onAskForSupport: () => void;
}

/**
 * What the survivor sees instead of the officer-facing 0-100 gauge.
 * Same underlying model output, phrased as reflection rather than assessment —
 * no score, no band name, no clinical vocabulary.
 */
const STATE = {
  Green: {
    ring: '#4E9E6B',
    soft: 'rgba(78,158,107,0.14)',
    heading: 'You have been fairly steady',
    body: 'Your recent check-ins look similar to your usual. That is worth acknowledging.',
  },
  Yellow: {
    ring: '#8EB996',
    soft: 'rgba(142,185,150,0.16)',
    heading: 'You have had some harder moments',
    body: 'A few recent check-ins have been heavier than your usual. That is a normal thing to go through.',
  },
  Orange: {
    ring: '#E8A23D',
    soft: 'rgba(232,162,61,0.14)',
    heading: 'This looks like a harder stretch',
    body: 'Things have felt heavier than usual for a little while now. Talking to someone could help — and it is always your choice.',
  },
  Red: {
    ring: '#E8703D',
    soft: 'rgba(232,112,61,0.14)',
    heading: 'This looks like a really hard time',
    body: 'Your recent check-ins suggest you are carrying a lot right now. You do not have to manage this on your own.',
  },
} as const;

const TREND_COPY: Record<string, string> = {
  improving: 'Gently easing compared with earlier',
  stable: 'Fairly steady compared with earlier',
  worsening: 'Heavier than it was earlier',
};

export function WellbeingState({ band, trend, onAskForSupport }: WellbeingStateProps) {
  const state = STATE[band as keyof typeof STATE] ?? STATE.Yellow;
  const urgent = band === 'Orange' || band === 'Red';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-7">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
        style={{ background: state.soft }}
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Breathing ring — a calm presence indicator, not a measurement */}
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${state.ring}`, opacity: 0.25 }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.08, 0.25] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <motion.span
            className="absolute rounded-full"
            style={{ background: state.soft, inset: '14%' }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
          <span
            className="relative h-12 w-12 rounded-full"
            style={{ background: state.ring, opacity: 0.85 }}
            aria-hidden="true"
          />
        </div>

        <h2 className="font-heading text-heading-lg font-semibold text-text-primary text-balance">
          {state.heading}
        </h2>
        <p className="mt-2.5 text-body-sm text-text-secondary leading-relaxed max-w-xs">{state.body}</p>

        <p className="mt-5 rounded-full bg-secondary-100 px-4 py-1.5 text-caption text-text-secondary">
          {TREND_COPY[trend] ?? 'Based on your recent check-ins'}
        </p>

        {urgent && (
          <button
            onClick={onAskForSupport}
            className="mt-5 w-full rounded-2xl bg-primary-500 px-4 py-3 text-body-sm font-medium text-white transition-colors hover:bg-primary-600"
          >
            Talk to someone
          </button>
        )}

        <p className="mt-5 text-caption text-text-muted">
          This is a reflection of your own check-ins — not a diagnosis.
        </p>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { DistressBand } from '@/types';

interface RadialDistressGaugeProps {
  score: number;
  band: DistressBand | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const BAND_COLORS: Record<string, string> = {
  Green: '#4E9E6B',
  Yellow: '#E8A23D',
  Orange: '#E8703D',
  Red: '#D9534F',
};

const BAND_LABELS: Record<string, string> = {
  Green: 'Stable',
  Yellow: 'Mild',
  Orange: 'Significant',
  Red: 'Urgent',
};

const SIZE_CONFIG = {
  xs: { box: 40, stroke: 4, font: 'text-[0.65rem]', showScore: false },
  sm: { box: 56, stroke: 5, font: 'text-body-sm', showScore: true },
  md: { box: 96, stroke: 7, font: 'text-heading-md', showScore: true },
  lg: { box: 152, stroke: 10, font: 'text-display-sm', showScore: true },
};

/**
 * SAHAAYA's signature score visualization — a 270° arc gauge, band-colored,
 * used consistently anywhere a distress score appears (tables, cards, headers).
 */
export function RadialDistressGauge({ score, band, size = 'md', showLabel = false, className }: RadialDistressGaugeProps) {
  const config = SIZE_CONFIG[size];
  const color = BAND_COLORS[band] || '#7A8D7F';
  const clamped = Math.max(0, Math.min(100, score));

  const box = config.box;
  const stroke = config.stroke;
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75; // 270-degree sweep
  const arcLength = circumference * arcFraction;
  const valueLength = (clamped / 100) * arcLength;

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: box, height: box }}>
        <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="-rotate-[225deg]">
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-secondary-200"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
          />
          <motion.circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: arcLength - valueLength }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        {config.showScore && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-heading font-bold tabular-nums leading-none', config.font)} style={{ color }}>
              {Math.round(clamped)}
            </span>
            {size === 'lg' && <span className="text-caption text-text-muted mt-0.5">/ 100</span>}
          </div>
        )}
      </div>
      {showLabel && (
        <span className="text-caption font-medium" style={{ color }}>
          {BAND_LABELS[band] || band}
        </span>
      )}
    </div>
  );
}

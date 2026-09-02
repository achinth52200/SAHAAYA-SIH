'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ClipboardCheck, Gavel, ShieldAlert, UserCheck } from 'lucide-react';
import { RadialDistressGauge } from '@/components/charts/RadialDistressGauge';
import type { DistressBand } from '@/types';

function bandForScore(score: number): DistressBand {
  if (score < 30) return 'Green';
  if (score < 50) return 'Yellow';
  if (score < 75) return 'Orange';
  return 'Red';
}

const steps = [
  { score: 28, label: 'Case registered', detail: 'Regular check-ins, stable baseline', Icon: ClipboardCheck },
  { score: 41, label: 'Threat reported', detail: 'Text sentiment shifts toward fear', Icon: ShieldAlert },
  { score: 58, label: 'Missed check-ins', detail: 'Two consecutive check-ins skipped', Icon: AlertTriangle },
  { score: 74, label: 'Court hearing delayed', detail: 'Case-event stress signal rises', Icon: Gavel },
  { score: 87, label: 'Human review triggered', detail: 'Explainable alert routed to counsellor', Icon: UserCheck },
];

/**
 * A staged, clearly-labeled illustration of the demo journey described in the PDR
 * (score 28 -> 87 across threat report / missed check-ins / court hearing). Not a
 * live model call — purely an animated walkthrough of the documented demo narrative.
 */
export function DemoJourneyPanel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % steps.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const step = steps[index];
  const band = bandForScore(step.score);

  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0">
      <div className="card p-6 bg-surface/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <p className="text-body-sm font-medium text-text-secondary">Illustrative demo journey</p>
          <span className="text-caption text-text-muted">Synthetic data</span>
        </div>

        <div className="flex items-center gap-5">
          <RadialDistressGauge score={step.score} band={band} size="lg" showLabel />
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 mb-2">
                  <step.Icon className="w-5 h-5" />
                </div>
                <p className="text-body-sm font-semibold text-text-primary">{step.label}</p>
                <p className="text-caption text-text-secondary mt-0.5">{step.detail}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i === index ? 'bg-primary-500' : 'bg-secondary-200'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

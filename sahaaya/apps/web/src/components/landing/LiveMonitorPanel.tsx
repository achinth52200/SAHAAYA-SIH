'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertTriangle, ClipboardCheck, Gavel, ShieldAlert, UserCheck } from 'lucide-react';

type Step = {
  day: string;
  score: number;
  label: string;
  detail: string;
  Icon: typeof Activity;
  signals: { name: string; value: number }[];
};

/**
 * A staged walkthrough of the demo journey documented in the PDR (score 28 -> 87 across
 * a threat report, missed check-ins and a court delay, ending in human review).
 * This is an illustration of the documented narrative, not a live model call.
 */
const STEPS: Step[] = [
  {
    day: 'Day 1',
    score: 28,
    label: 'Case registered',
    detail: 'Baseline established from first check-ins',
    Icon: ClipboardCheck,
    signals: [
      { name: 'Self-report', value: 30 },
      { name: 'Text emotion', value: 22 },
      { name: 'Behaviour', value: 15 },
      { name: 'Case events', value: 20 },
    ],
  },
  {
    day: 'Day 12',
    score: 41,
    label: 'Threat reported',
    detail: 'Text sentiment shifts toward fear and threat language',
    Icon: ShieldAlert,
    signals: [
      { name: 'Self-report', value: 42 },
      { name: 'Text emotion', value: 58 },
      { name: 'Behaviour', value: 24 },
      { name: 'Case events', value: 45 },
    ],
  },
  {
    day: 'Day 21',
    score: 58,
    label: 'Check-ins missed',
    detail: 'Two consecutive check-ins skipped — withdrawal pattern',
    Icon: AlertTriangle,
    signals: [
      { name: 'Self-report', value: 55 },
      { name: 'Text emotion', value: 64 },
      { name: 'Behaviour', value: 71 },
      { name: 'Case events', value: 48 },
    ],
  },
  {
    day: 'Day 30',
    score: 74,
    label: 'Hearing adjourned',
    detail: 'Case-event stress compounds an already rising trend',
    Icon: Gavel,
    signals: [
      { name: 'Self-report', value: 68 },
      { name: 'Text emotion', value: 72 },
      { name: 'Behaviour', value: 76 },
      { name: 'Case events', value: 82 },
    ],
  },
  {
    day: 'Day 34',
    score: 87,
    label: 'Human review triggered',
    detail: 'Explainable alert routed to a counsellor for decision',
    Icon: UserCheck,
    signals: [
      { name: 'Self-report', value: 84 },
      { name: 'Text emotion', value: 79 },
      { name: 'Behaviour', value: 88 },
      { name: 'Case events', value: 86 },
    ],
  },
];

const CURVE = [26, 28, 31, 29, 34, 41, 44, 52, 58, 61, 69, 74, 79, 87];

function bandColor(score: number) {
  if (score < 30) return '#4E9E6B';
  if (score < 50) return '#E8A23D';
  if (score < 75) return '#E8703D';
  return '#D9534F';
}

function bandName(score: number) {
  if (score < 30) return 'STABLE';
  if (score < 50) return 'MILD';
  if (score < 75) return 'SIGNIFICANT';
  return 'URGENT';
}

export function LiveMonitorPanel() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % STEPS.length), 2800);
    return () => clearInterval(t);
  }, []);

  const step = STEPS[i];
  const color = bandColor(step.score);
  const progress = (i + 1) / STEPS.length;

  // The full curve is always drawn faintly; the traversed portion is highlighted
  const W = 300;
  const H = 68;
  const toPath = (values: number[]) =>
    values
      .map((v, idx) => {
        const x = (idx / (CURVE.length - 1)) * W;
        const y = H - (v / 100) * H;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const shown = Math.max(3, Math.round(CURVE.length * progress));
  const pts = CURVE.slice(0, shown);
  const fullPath = toPath(CURVE);
  const path = toPath(pts);
  const lastX = ((pts.length - 1) / (CURVE.length - 1)) * W;
  const lastY = H - (pts[pts.length - 1] / 100) * H;
  const areaPath = `${path} L${lastX.toFixed(1)},${H} L0,${H} Z`;

  // 270-degree gauge arc
  const R = 46;
  const C = 2 * Math.PI * R;
  const ARC = C * 0.75;

  return (
    <div className="relative w-full max-w-[420px] mx-auto lg:mx-0">
      {/* ambient glow behind the panel */}
      <div
        className="absolute -inset-6 rounded-[40px] blur-3xl opacity-60 transition-colors duration-700"
        style={{ background: `radial-gradient(circle at 50% 40%, ${color}33, transparent 70%)` }}
        aria-hidden="true"
      />

      <div className="relative console-panel rounded-3xl p-5 glow-ring">
        {/* Console header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-distress-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-distress-green" />
            </span>
            <span className="text-[11px] font-medium tracking-[0.14em] text-white/70">LIVE MONITOR</span>
          </div>
          <span className="text-[11px] font-mono text-white/40">VICTIM_0042 · {step.day}</span>
        </div>

        {/* Gauge + trend */}
        <div className="flex items-center gap-4 py-5">
          <div className="relative flex-shrink-0" style={{ width: 108, height: 108 }}>
            <svg width={108} height={108} viewBox="0 0 108 108" className="-rotate-[225deg]">
              <circle
                cx={54} cy={54} r={R} fill="none" stroke="rgba(255,255,255,0.12)"
                strokeWidth={8} strokeLinecap="round" strokeDasharray={`${ARC} ${C}`}
              />
              <motion.circle
                cx={54} cy={54} r={R} fill="none" stroke={color}
                strokeWidth={8} strokeLinecap="round" strokeDasharray={`${ARC} ${C}`}
                animate={{ strokeDashoffset: ARC - (step.score / 100) * ARC }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                key={step.score}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-heading text-[30px] font-bold leading-none tabular-nums"
                style={{ color }}
              >
                {step.score}
              </motion.span>
              <span className="text-[9px] tracking-[0.12em] mt-1 font-medium" style={{ color }}>
                {bandName(step.score)}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.14em] text-white/40 mb-1.5">DISTRESS TREND</p>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[68px]" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lmp-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <line x1="0" y1={H - (30 / 100) * H} x2={W} y2={H - (30 / 100) * H} stroke="rgba(255,255,255,0.10)" strokeDasharray="3 4" />
              <line x1="0" y1={H - (75 / 100) * H} x2={W} y2={H - (75 / 100) * H} stroke="rgba(217,83,79,0.28)" strokeDasharray="3 4" />
              <path d={fullPath} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              <path d={areaPath} fill="url(#lmp-area)" />
              <motion.path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={false}
                animate={{ d: path }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <circle cx={lastX} cy={lastY} r={3.5} fill="#0B140F" stroke={color} strokeWidth={2} />
            </svg>
          </div>
        </div>

        {/* Signal contributions */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-4 border-t border-white/10">
          {step.signals.map((s) => (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/50">{s.name}</span>
                <span className="text-[10px] font-mono text-white/70 tabular-nums">{s.value}</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  animate={{ width: `${s.value}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Current event */}
        <div className="pt-4 border-t border-white/10 min-h-[74px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22`, color }}
              >
                <step.Icon className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-white/90 leading-tight">{step.label}</p>
                <p className="text-[11px] text-white/50 mt-0.5 leading-snug">{step.detail}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Journey progress */}
        <div className="flex items-center gap-1.5 mt-4">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className="h-[3px] flex-1 rounded-full overflow-hidden bg-white/10"
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: idx <= i ? '100%' : '0%', background: idx <= i ? color : 'transparent' }}
              />
            </div>
          ))}
        </div>
      </div>

      <p className="text-center lg:text-left text-[11px] text-white/35 mt-3">
        Illustrative journey from the PDR demo narrative · synthetic data
      </p>
    </div>
  );
}

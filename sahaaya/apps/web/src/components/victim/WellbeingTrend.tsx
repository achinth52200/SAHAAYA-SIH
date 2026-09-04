'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Point {
  date: string;
  score: number;
}

interface WellbeingTrendProps {
  points: Point[];
  /** The person's own baseline, used only to phrase "compared with your usual" — never shown as a number. */
  baseline: number;
}

/**
 * The survivor-facing view of the same data the officer dashboard charts clinically.
 * Per the design document this is deliberately softened: no 0-100 score, no band
 * thresholds, no "distress" language — just how they have been feeling over time,
 * relative to their own usual range.
 */
export function WellbeingTrend({ points, baseline }: WellbeingTrendProps) {
  // Higher distress = harder day. Invert so "up" reads as "feeling better",
  // which is the intuitive direction for a personal wellbeing view.
  const data = points.map((p) => ({
    date: new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    ease: Math.max(0, Math.min(100, 100 - p.score)),
    raw: p.score,
  }));

  const describe = (raw: number) => {
    const delta = raw - baseline;
    if (delta > 8) return 'A harder day than usual for you';
    if (delta < -8) return 'An easier day than usual for you';
    return 'About usual for you';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-elevated">
        <p className="text-body-sm font-semibold text-text-primary">{label}</p>
        <p className="text-body-sm text-text-secondary mt-0.5">{describe(payload[0].payload.raw)}</p>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-body-sm text-text-muted">
        Your check-ins will appear here once you have made a few.
      </div>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="wellbeing-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5E9A6D" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#5E9A6D" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#7A8D7F' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
            dy={8}
          />
          {/* No numeric axis — the shape of the line is the message, not a score */}
          <YAxis domain={[0, 100]} hide />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#BAD4BF', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="ease"
            stroke="#3E7C59"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="url(#wellbeing-fill)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF', fill: '#3E7C59' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between px-3 mt-1">
        <span className="text-caption text-text-muted">Harder stretches dip lower</span>
        <span className="text-caption text-text-muted">Easier stretches rise higher</span>
      </div>
    </div>
  );
}

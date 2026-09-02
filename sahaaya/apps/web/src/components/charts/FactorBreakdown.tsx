'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import type { DistressComponents } from '@/types';

interface FactorBreakdownProps {
  components: DistressComponents;
}

const componentConfig = [
  { key: 'self_report', label: 'Self-Report', weight: 35, color: '#3E7C59' },
  { key: 'text_emotion', label: 'Text Emotion', weight: 20, color: '#4E9E6B' },
  { key: 'behavioural', label: 'Behavioural', weight: 15, color: '#E8A23D' },
  { key: 'voice', label: 'Voice', weight: 10, color: '#E8703D' },
  { key: 'case_events', label: 'Case Events', weight: 10, color: '#D9534F' },
  { key: 'trend', label: 'Trend', weight: 10, color: '#316649' },
];

export function FactorBreakdown({ components }: FactorBreakdownProps) {
  const chartData = componentConfig.map((c) => ({
    name: c.label,
    score: components[c.key as keyof DistressComponents] || 0,
    weight: c.weight,
    contribution: ((components[c.key as keyof DistressComponents] || 0) * c.weight) / 100,
    color: c.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-xl p-3 shadow-elevated min-w-[180px]">
          <p className="font-semibold text-text-primary">{data.name}</p>
          <div className="space-y-1 mt-1">
            <p className="text-body-sm text-text-secondary">Component Score: <strong className="text-text-primary">{data.score.toFixed(1)}</strong></p>
            <p className="text-body-sm text-text-secondary">Weight: <strong>{data.weight}%</strong></p>
            <p className="text-body-sm text-text-secondary">Contribution: <strong className="text-distress-red">{data.contribution.toFixed(1)}</strong></p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-4">
      {/* Horizontal bar chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D4D8D5" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#7A8D7F', fontFamily: 'Inter' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#1F2A24', fontFamily: 'Inter', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weight & Contribution breakdown */}
      <div className="space-y-3 pt-2 border-t border-border">
        {chartData.map((item) => (
          <motion.div
            key={item.name}
            className="flex items-center justify-between gap-4 p-3 rounded-xl bg-secondary-50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 min-w-[120px]">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-body-sm font-medium text-text-primary">{item.name}</span>
              <Badge variant="gray" size="sm">{item.weight}% weight</Badge>
            </div>
            <div className="flex items-center gap-4 text-right flex-1">
              <div className="text-body-sm text-text-secondary">
                Score: <strong className="text-text-primary">{item.score.toFixed(1)}</strong>
              </div>
              <div className="text-body-sm font-semibold" style={{ color: item.color }}>
                +{item.contribution.toFixed(1)}
              </div>
              {/* Mini progress bar */}
              <div className="w-24 h-2 bg-secondary-100 rounded-full overflow-hidden flex-shrink-0">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.score, 100)}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
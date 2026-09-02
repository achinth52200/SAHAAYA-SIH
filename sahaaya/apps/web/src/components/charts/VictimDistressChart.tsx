'use client';

import { useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { DistressScore } from '@/types';

interface HistoryPoint {
  date: string;
  distress_score: number;
}

interface VictimDistressChartProps {
  history: any[];
  currentScore: number;
  baseline: number;
}

export function VictimDistressChart({ history, currentScore, baseline }: VictimDistressChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Transform history data
  const chartData = history
    .filter((h) => h.distress_score !== undefined)
    .slice(-30)
    .map((h) => ({
      date: new Date(h.checkin_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      score: h.distress_score,
      fullDate: h.checkin_date,
    }));

  // Add current score if not in history
  if (chartData.length === 0 || chartData[chartData.length - 1].score !== currentScore) {
    chartData.push({
      date: 'Now',
      score: currentScore,
      fullDate: new Date().toISOString(),
    });
  }

  const getBandColor = (score: number) => {
    if (score < 30) return '#4E9E6B';
    if (score < 50) return '#E8A23D';
    if (score < 75) return '#E8703D';
    return '#D9534F';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border rounded-xl p-3 shadow-elevated min-w-[200px]">
          <p className="font-semibold text-text-primary">{label}</p>
          <p className="text-body text-text-secondary">Distress Score: <strong className="text-text-primary">{data.score}</strong></p>
          <p className="text-body-sm text-text-muted mt-1">
            Band: <strong style={{ color: getBandColor(data.score) }}>
              {data.score < 30 ? 'Green' : data.score < 50 ? 'Yellow' : data.score < 75 ? 'Orange' : 'Red'}
            </strong>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64" ref={chartRef}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorDistress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4E9E6B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4E9E6B" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3E7C59" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3E7C59" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#D4D8D5" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#7A8D7F', fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#7A8D7F', fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} wrapperStyle={{ backgroundColor: 'transparent', boxShadow: 'none' }} />

          {/* Band reference areas */}
          <ReferenceLine y={30} stroke="#4E9E6B" strokeWidth={1} strokeDasharray="2 2" label={{ value: 'Green', position: 'insideBottomLeft', fill: '#4E9E6B', fontSize: 10, dy: -2 }} />
          <ReferenceLine y={50} stroke="#E8A23D" strokeWidth={1} strokeDasharray="2 2" label={{ value: 'Yellow', position: 'insideBottomLeft', fill: '#E8A23D', fontSize: 10, dy: -2 }} />
          <ReferenceLine y={75} stroke="#E8703D" strokeWidth={1} strokeDasharray="2 2" label={{ value: 'Orange', position: 'insideBottomLeft', fill: '#E8703D', fontSize: 10, dy: -2 }} />

          {/* Baseline reference */}
          <ReferenceLine
            y={baseline}
            stroke="#3E7C59"
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{ value: `Baseline (${baseline.toFixed(1)})`, position: 'right', fill: '#3E7C59', fontSize: 10, fontWeight: 500 }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke="#3E7C59"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDistress)"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#3E7C59"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: '#3E7C59', fill: '#FFFFFF' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#3E7C59' }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
'use client';

import { motion } from 'framer-motion';
import {
  Gavel,
  ShieldAlert,
  Search,
  Landmark,
  HeartHandshake,
  Wallet,
  FileWarning,
  Home,
  ClipboardCheck,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

interface CaseTimelineProps {
  caseEvents: any[];
  checkins: any[];
  className?: string;
}

function iconForEventType(eventType: string) {
  const t = eventType.toLowerCase();
  if (t.includes('fir')) return FileWarning;
  if (t.includes('investigation')) return Search;
  if (t.includes('threat')) return ShieldAlert;
  if (t.includes('bail') || t.includes('court') || t.includes('hearing')) return Gavel;
  if (t.includes('compensation')) return Wallet;
  if (t.includes('counsel')) return HeartHandshake;
  if (t.includes('rehab')) return Home;
  if (t.includes('landmark') || t.includes('verdict')) return Landmark;
  return ClipboardCheck;
}

function moodColor(mood: number) {
  if (mood >= 70) return '#4E9E6B';
  if (mood >= 50) return '#8EB996';
  if (mood >= 30) return '#E8A23D';
  return '#D9534F';
}

export function CaseTimeline({ caseEvents, checkins, className }: CaseTimelineProps) {
  type Item = {
    key: string;
    date: string;
    kind: 'case_event' | 'checkin';
    title: string;
    description?: string;
    color: string;
    Icon: typeof CircleDot;
    urgent?: boolean;
    prototypeLabel?: string;
  };

  const items: Item[] = [
    ...caseEvents.map((e): Item => ({
      key: e.event_id,
      date: e.event_date,
      kind: 'case_event',
      title: e.event_type,
      description: e.description,
      color: e.stress_impact >= 15 ? '#D9534F' : e.stress_impact >= 8 ? '#E8703D' : '#3E7C59',
      Icon: iconForEventType(e.event_type || ''),
      prototypeLabel: e.label,
    })),
    ...checkins.map((c): Item => ({
      key: c.checkin_id,
      date: c.checkin_date,
      kind: 'checkin',
      title: c.scores?.urgent_help ? 'Urgent help requested at check-in' : 'Wellbeing check-in completed',
      description: `Mood ${c.scores?.mood ?? '—'} · Sleep ${c.scores?.sleep_quality ?? '—'} · Safety ${c.scores?.safety ?? '—'} (via ${c.channel})`,
      color: moodColor(c.scores?.mood ?? 50),
      Icon: CircleDot,
      urgent: !!c.scores?.urgent_help,
      prototypeLabel: c.label,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-10 text-text-muted', className)}>
        <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-border" />
        <p className="text-body-sm">No case events or check-ins recorded yet</p>
      </div>
    );
  }

  return (
    <div className={cn('relative pl-2', className)}>
      <div className="absolute left-[27px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
      <ol className="space-y-6">
        {items.map((item, i) => (
          <motion.li
            key={item.key}
            className="relative flex gap-4"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.04, 0.6), duration: 0.4 }}
          >
            <div
              className={cn(
                'relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-surface',
                item.urgent && 'ring-4 ring-distress-red/20'
              )}
              style={{ borderColor: item.color }}
            >
              <item.Icon className="w-4 h-4" style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-body-sm font-semibold text-text-primary">{item.title}</p>
                <span className="text-caption text-text-muted">{formatDate(item.date)}</span>
                {item.kind === 'case_event' && (
                  <span className="badge badge-gray text-[0.625rem]">Case Event</span>
                )}
              </div>
              {item.description && (
                <p className="text-body-sm text-text-secondary mt-0.5">{item.description}</p>
              )}
              {item.prototypeLabel && (
                <p className="text-caption text-text-muted/70 mt-1 italic">{item.prototypeLabel}</p>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

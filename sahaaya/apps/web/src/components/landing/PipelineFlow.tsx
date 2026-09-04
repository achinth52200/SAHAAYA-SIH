'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Brain, MessageSquare, ScanSearch, Shield, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const LAYERS = [
  {
    id: '01',
    title: 'Interaction',
    icon: MessageSquare,
    detail: 'App · Chatbot · IVRS · SMS',
    items: ['12 languages', 'Low-friction check-ins', 'Consent-gated'],
  },
  {
    id: '02',
    title: 'Data Collection',
    icon: BarChart3,
    detail: 'Five independent signal streams',
    items: ['Self-reports', 'Text & voice', 'Case events'],
  },
  {
    id: '03',
    title: 'AI Analysis',
    icon: Brain,
    detail: 'Emotion · behaviour · acoustics',
    items: ['Multilingual NLP', 'Pattern detection', 'Never mixed'],
  },
  {
    id: '04',
    title: 'Distress Engine',
    icon: ScanSearch,
    detail: 'Weighted composite, 0–100',
    items: ['Personal baseline', 'Trend & escalation', 'Green→Red bands'],
  },
  {
    id: '05',
    title: 'Explainability',
    icon: Shield,
    detail: 'Every score comes with a reason',
    items: ['Feature importance', 'Clinical summary', 'Counterfactuals'],
  },
  {
    id: '06',
    title: 'Human Review',
    icon: UserCheck,
    detail: 'A person decides — always',
    items: ['Officer inbox', 'Intervention tracking', 'Full audit trail'],
  },
];

export function PipelineFlow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((v) => (v + 1) % LAYERS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      {/* Connector rail (desktop) */}
      <div className="hidden lg:block absolute top-[46px] left-[8%] right-[8%] h-px bg-white/10" aria-hidden="true">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-400 to-distress-yellow"
          animate={{ width: `${((active + 1) / LAYERS.length) * 100}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
        {LAYERS.map((layer, i) => {
          const isActive = i === active;
          const isPast = i < active;
          return (
            <motion.button
              key={layer.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="relative text-left group focus:outline-none"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
            >
              {/* Node */}
              <div className="flex lg:justify-center mb-4">
                <div
                  className={cn(
                    'relative w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-500',
                    isActive
                      ? 'bg-primary-400 text-[#0B140F] scale-110'
                      : isPast
                      ? 'bg-primary-500/30 text-primary-200'
                      : 'bg-white/[0.07] text-white/40 border border-white/10'
                  )}
                  style={isActive ? { boxShadow: '0 0 0 6px rgba(142,185,150,0.12), 0 12px 30px -8px rgba(94,154,109,0.6)' } : undefined}
                >
                  <layer.icon className="w-6 h-6" />
                  {isActive && (
                    <motion.span
                      className="absolute inset-0 rounded-2xl border border-primary-300"
                      initial={{ opacity: 0.8, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.5 }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </div>
              </div>

              <div className={cn('transition-opacity duration-500', isActive ? 'opacity-100' : 'opacity-85 group-hover:opacity-100')}>
                <p className="text-[10px] font-mono tracking-[0.16em] text-primary-300 mb-1">{layer.id}</p>
                <h3 className="font-heading font-semibold text-heading-sm text-white mb-1.5">{layer.title}</h3>
                <p className="text-[12px] text-white/60 mb-3 leading-snug">{layer.detail}</p>
                <ul className="space-y-1">
                  {layer.items.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-[12px] text-white/75">
                      <span
                        className={cn(
                          'mt-[6px] w-1 h-1 rounded-full flex-shrink-0 transition-colors duration-500',
                          isActive ? 'bg-primary-300' : 'bg-white/25'
                        )}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

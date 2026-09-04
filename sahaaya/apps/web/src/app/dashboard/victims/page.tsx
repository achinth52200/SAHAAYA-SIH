'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  Download,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, DistressBandBadge, PriorityBadge, StatusBadge,
  Button, Input, Select,
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useAuthStore } from '@/lib/store';
import { ExportDialog } from '@/components/ExportDialog';
import type { CsvColumn } from '@/lib/export';
import type { VictimSummary } from '@/types';

export default function VictimsPage() {
  const [data, setData] = useState<VictimSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBand, setFilterBand] = useState<'all' | 'Green' | 'Yellow' | 'Orange' | 'Red'>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest_score' | 'latest_band' | 'trend' | 'risk'>('latest_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [exportOpen, setExportOpen] = useState(false);
  const [enriching, setEnriching] = useState(false);
  // Full DistressScore per victim, fetched on demand: /api/v1/victims returns only a
  // summary, so the component breakdown, baseline and confidence are not available
  // until each victim's distress record is loaded.
  const [detail, setDetail] = useState<Record<string, any>>({});
  const { user } = useAuthStore();

  const openExport = async () => {
    setExportOpen(true);
    if (data.length === 0 || Object.keys(detail).length >= data.length) return;
    setEnriching(true);
    try {
      const entries = await Promise.all(
        data.map(async (v) => {
          try {
            const res = await api.getVictimDistress(v.victim_id);
            return [v.victim_id, res.data] as const;
          } catch {
            return [v.victim_id, null] as const;
          }
        }),
      );
      setDetail(Object.fromEntries(entries));
    } finally {
      setEnriching(false);
    }
  };

  const pct = (n: number | undefined | null) =>
    n === undefined || n === null ? '' : Math.round(n * 100);
  const comp = (v: VictimSummary, key: string) => {
    const c = detail[v.victim_id]?.components?.[key];
    return typeof c === 'number' ? c.toFixed(1) : '';
  };

  /** Columns offered by the export dialog, grouped so officers can pick a subset. */
  const victimColumns: CsvColumn<VictimSummary>[] = [
    { group: 'Identity', header: 'Victim ID', value: (v) => v.victim_id },
    { group: 'Identity', header: 'Case Type', value: (v) => v.case_type },
    { group: 'Identity', header: 'Preferred Language', value: (v) => v.preferred_language },
    { group: 'Location', header: 'District', value: (v) => v.district },
    { group: 'Location', header: 'State', value: (v) => v.state },
    { group: 'Distress', header: 'Distress Score', value: (v) => v.latest_score?.toFixed(1) ?? '' },
    { group: 'Distress', header: 'Band', value: (v) => v.latest_band ?? '' },
    {
      group: 'Distress',
      header: 'Band Meaning',
      value: (v) =>
        ({ Green: 'Stable', Yellow: 'Mild concern', Orange: 'Significant concern', Red: 'Urgent review' } as Record<string, string>)[
          v.latest_band ?? ''
        ] ?? '',
    },
    { group: 'Distress', header: 'Trend', value: (v) => v.trend ?? '' },
    // Weighted components behind the composite score. Weights match the scoring model.
    { group: 'Score Components', header: 'Self-Report (35%)', value: (v) => comp(v, 'self_report') },
    { group: 'Score Components', header: 'Text Emotion (20%)', value: (v) => comp(v, 'text_emotion') },
    { group: 'Score Components', header: 'Behavioural (15%)', value: (v) => comp(v, 'behavioural') },
    { group: 'Score Components', header: 'Voice (10%)', value: (v) => comp(v, 'voice') },
    { group: 'Score Components', header: 'Case Events (10%)', value: (v) => comp(v, 'case_events') },
    { group: 'Score Components', header: 'Trend (10%)', value: (v) => comp(v, 'trend') },
    {
      group: 'Baseline',
      header: 'Personal Baseline',
      value: (v) => detail[v.victim_id]?.personal_baseline?.toFixed(1) ?? '',
    },
    {
      group: 'Baseline',
      header: 'Deviation From Baseline',
      value: (v) => {
        const d = detail[v.victim_id];
        if (!d || typeof d.personal_baseline !== 'number' || typeof d.distress_score !== 'number') return '';
        return (d.distress_score - d.personal_baseline).toFixed(1);
      },
    },
    {
      group: 'Risk',
      header: '7-Day Escalation Risk (%)',
      value: (v) => pct(detail[v.victim_id]?.escalation_probability_7d ?? v.escalation_probability_7d),
    },
    {
      group: 'Risk',
      header: '30-Day Escalation Risk (%)',
      value: (v) => pct(detail[v.victim_id]?.escalation_probability_30d),
    },
    {
      group: 'Risk',
      header: 'Model Confidence (%)',
      value: (v) => pct(detail[v.victim_id]?.confidence),
    },
    {
      group: 'Risk',
      header: 'Requires Human Review',
      value: (v) => (v.latest_band === 'Orange' || v.latest_band === 'Red' ? 'Yes' : 'No'),
    },
    { group: 'Provenance', header: 'Data Classification', value: () => 'PROTOTYPE DATA — NOT REAL VICTIM DATA' },
  ];

  const filterSummary = [
    search ? `search "${search}"` : null,
    filterBand !== 'all' ? `band ${filterBand}` : null,
    filterDistrict ? `district ${filterDistrict}` : null,
    filterState ? `state ${filterState}` : null,
  ].filter(Boolean).join(', ') || 'No filters applied';

  const loadVictims = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await api.getVictims();
      setData(res.data);
    } catch (error) {
      console.error('Failed to load victims:', error);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVictims();
  }, [loadVictims]);

  // Background refresh keeps scores current without flashing the loading skeleton.
  useAutoRefresh(() => loadVictims(false), { intervalMs: 20000 });

  const filteredVictims = data
    .filter((v) => {
      if (search && !v.victim_id.toLowerCase().includes(search.toLowerCase()) &&
          !v.case_type.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterBand !== 'all' && v.latest_band !== filterBand) return false;
      if (filterDistrict && v.district !== filterDistrict) return false;
      if (filterState && v.state !== filterState) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortBy === 'risk' ? 'latest_score' : sortBy];
      const bVal = b[sortBy === 'risk' ? 'latest_score' : sortBy];
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const districts = Array.from(new Set(data.map(v => v.district))).sort();
  const states = Array.from(new Set(data.map(v => v.state))).sort();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-48 bg-secondary-100 rounded" />
          <div className="h-4 w-96 bg-secondary-100 rounded" />
        </div>
        <Card padding="md"><div className="h-64 bg-secondary-100 rounded" /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <Users className="w-4 h-4" />
            <span>Victims Management</span>
          </div>
          <h1 className="text-display-sm font-heading font-bold text-text-primary">All Victims</h1>
          <p className="text-body text-text-secondary mt-1">
            {data.length} victims • {data.filter(v => v.latest_band === 'Orange' || v.latest_band === 'Red').length} high risk
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={openExport} loading={enriching} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </div>
      </motion.div>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        filteredRows={filteredVictims}
        allRows={data}
        columns={victimColumns}
        baseName="victims"
        title="Victim register with distress status"
        filterSummary={filterSummary}
        exportedBy={user ? `${user.name} (${user.role})` : undefined}
      />

      {/* Filters */}
      <motion.section className="card p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search victim ID or case type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterBand} onChange={(e) => setFilterBand(e.target.value as any)} className="w-auto min-w-[160px]">
            <option value="all">All Bands</option>
            <option value="Red">Red (Urgent)</option>
            <option value="Orange">Orange (Significant)</option>
            <option value="Yellow">Yellow (Mild)</option>
            <option value="Green">Green (Stable)</option>
          </Select>
          <Select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} className="w-auto min-w-[180px]">
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="w-auto min-w-[160px]">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-auto min-w-[140px]">
            <option value="latest_score">Distress Score</option>
            <option value="latest_band">Band</option>
            <option value="trend">Trend</option>
            <option value="risk">7-day Risk</option>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} aria-label="Toggle sort order">
            <ChevronDown className={cn('w-4 h-4', sortOrder === 'desc' && 'rotate-180')} />
          </Button>
          {(search || filterBand !== 'all' || filterDistrict || filterState) && (
            <Button variant="ghost" size="icon" onClick={() => { setSearch(''); setFilterBand('all'); setFilterDistrict(''); setFilterState(''); }}>
              <Filter className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.section>

      {/* Victims Table */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card padding="none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-border bg-secondary-50">
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Victim ID</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Case Type</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">District</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">State</th>
                    <th className="px-4 py-3 text-right text-caption font-medium text-text-muted uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Band</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Trend</th>
                    <th className="px-4 py-3 text-right text-caption font-medium text-text-muted uppercase tracking-wider">7-day Risk</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVictims.map((victim, i) => (
                    <motion.tr key={victim.victim_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-secondary-50">
                      <td className="px-4 py-3 font-mono text-body-sm">
                        <Link href={`/dashboard/victims/${victim.victim_id}`} className="text-primary-500 hover:text-primary-600 font-medium">
                          {victim.victim_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{victim.case_type}</td>
                      <td className="px-4 py-3">{victim.district}</td>
                      <td className="px-4 py-3">{victim.state}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {victim.latest_score !== undefined && victim.latest_score !== null ? (
                          <span className={cn('distress-score font-bold', `distress-score-${(victim.latest_band || 'Green').toLowerCase()}`)}>
                            {victim.latest_score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <DistressBandBadge band={victim.latest_band as any} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          victim.trend === 'worsening' ? 'red' :
                          victim.trend === 'improving' ? 'green' : 'gray'
                        } size="sm" dot>
                          {victim.trend ? victim.trend.charAt(0).toUpperCase() + victim.trend.slice(1) : '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {victim.escalation_probability_7d !== undefined && victim.escalation_probability_7d !== null ? (
                          <span className={cn(
                            'font-heading font-semibold tabular-nums',
                            victim.escalation_probability_7d >= 0.6 ? 'text-distress-orange' : 'text-text-primary'
                          )}>
                            {Math.round(victim.escalation_probability_7d * 100)}%
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/victims/${victim.victim_id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredVictims.length === 0 && (
                <div className="p-12 text-center text-text-muted">
                  <AlertTriangle className="w-12 h-12 mx-auto text-border mb-3" />
                  <p className="text-body">No victims found</p>
                  <p className="text-body-sm mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
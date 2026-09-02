'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.getVictims();
        setData(res.data);
      } catch (error) {
        console.error('Failed to load victims:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export CSV</Button>
        </div>
      </motion.div>

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
                        <DistressBandBadge band={victim.latest_band as any} size="sm" showScore={victim.latest_score ?? undefined} />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          victim.trend === 'worsening' ? 'red' :
                          victim.trend === 'improving' ? 'green' : 'gray'
                        } size="sm">
                          {victim.trend || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-body-sm">
                        {victim.escalation_probability_7d !== undefined ? `${Math.round(victim.escalation_probability_7d * 100)}%` : '—'}
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
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Search,
  Filter,
  Download,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, DistressBandBadge, PriorityBadge, StatusBadge,
  Button, Input, Select,
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { DistrictDashboard } from '@/types';

interface DistrictSummary {
  district: string;
  state: string;
  total_victims: number;
  band_distribution: { Green: number; Yellow: number; Orange: number; Red: number };
  high_risk_count: number;
  high_risk_percentage: number;
}

export default function DistrictsPage() {
  const [data, setData] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState<string>('');
  const [sortBy, setSortBy] = useState<'total_victims' | 'high_risk_count' | 'high_risk_percentage' | 'district'>('high_risk_count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const victimsRes = await api.getVictims();
        const victims = victimsRes.data;
        
        const districtMap = new Map<string, DistrictSummary>();
        for (const v of victims) {
          const key = `${v.state}:${v.district}`;
          if (!districtMap.has(key)) {
            districtMap.set(key, {
              district: v.district,
              state: v.state,
              total_victims: 0,
              band_distribution: { Green: 0, Yellow: 0, Orange: 0, Red: 0 },
              high_risk_count: 0,
              high_risk_percentage: 0,
            });
          }
          const d = districtMap.get(key)!;
          d.total_victims++;
          const band = v.latest_band || 'Green';
          d.band_distribution[band as keyof typeof d.band_distribution]++;
        }
        
        for (const d of Array.from(districtMap.values())) {
          d.high_risk_count = d.band_distribution.Orange + d.band_distribution.Red;
          d.high_risk_percentage = d.total_victims > 0 
            ? Math.round((d.high_risk_count / d.total_victims) * 100) 
            : 0;
        }
        
        setData(Array.from(districtMap.values()));
      } catch (error) {
        console.error('Failed to load districts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredDistricts = data
    .filter((d) => {
      if (search && !d.district.toLowerCase().includes(search.toLowerCase()) &&
          !d.state.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterState && d.state !== filterState) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const states = Array.from(new Set(data.map(d => d.state))).sort();

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
            <MapPin className="w-4 h-4" />
            <span>Districts Management</span>
          </div>
          <h1 className="text-display-sm font-heading font-bold text-text-primary">All Districts</h1>
          <p className="text-body text-text-secondary mt-1">
            {data.length} districts • {data.reduce((sum, d) => sum + d.total_victims, 0)} total victims
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
              placeholder="Search district or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="w-auto min-w-[160px]">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-auto min-w-[180px]">
            <option value="high_risk_count">High Risk Count</option>
            <option value="high_risk_percentage">High Risk %</option>
            <option value="total_victims">Total Victims</option>
            <option value="district">District Name</option>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} aria-label="Toggle sort order">
            <ChevronDown className={cn('w-4 h-4', sortOrder === 'desc' && 'rotate-180')} />
          </Button>
          {(search || filterState) && (
            <Button variant="ghost" size="icon" onClick={() => { setSearch(''); setFilterState(''); }}>
              <Filter className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.section>

      {/* Districts Table */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card padding="none">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-border bg-secondary-50">
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">District</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">State</th>
                    <th className="px-4 py-3 text-right text-caption font-medium text-text-muted uppercase tracking-wider">Total Victims</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Green</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Yellow</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Orange</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Red</th>
                    <th className="px-4 py-3 text-right text-caption font-medium text-text-muted uppercase tracking-wider">High Risk</th>
                    <th className="px-4 py-3 text-right text-caption font-medium text-text-muted uppercase tracking-wider">High Risk %</th>
                    <th className="px-4 py-3 text-left text-caption font-medium text-text-muted uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDistricts.map((district, i) => (
                    <motion.tr key={`${district.state}:${district.district}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-secondary-50">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/dashboard/districts/${district.district}`} className="text-primary-500 hover:text-primary-600 flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {district.district}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{district.state}</td>
                      <td className="px-4 py-3 text-right font-mono">{district.total_victims}</td>
                      <td className="px-4 py-3">
                        <DistressBandBadge band="Green" size="sm" showScore={district.band_distribution.Green} />
                      </td>
                      <td className="px-4 py-3">
                        <DistressBandBadge band="Yellow" size="sm" showScore={district.band_distribution.Yellow} />
                      </td>
                      <td className="px-4 py-3">
                        <DistressBandBadge band="Orange" size="sm" showScore={district.band_distribution.Orange} />
                      </td>
                      <td className="px-4 py-3">
                        <DistressBandBadge band="Red" size="sm" showScore={district.band_distribution.Red} />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-distress-orange">{district.high_risk_count}</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={district.high_risk_percentage > 30 ? 'red' : district.high_risk_percentage > 15 ? 'yellow' : 'green'} size="sm">
                          {district.high_risk_percentage}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/districts/${district.district}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filteredDistricts.length === 0 && (
                <div className="p-12 text-center text-text-muted">
                  <MapPin className="w-12 h-12 mx-auto text-border mb-3" />
                  <p className="text-body">No districts found</p>
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
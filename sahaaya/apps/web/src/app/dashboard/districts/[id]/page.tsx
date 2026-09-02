'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  MapPin,
  ArrowRight,
  Filter,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, DistressBandBadge, PriorityBadge, StatusBadge,
  Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { DistrictDashboard, VictimSummary } from '@/types';

export default function DistrictDashboardPage() {
  const params = useParams();
  const districtId = params.id as string;
  const [data, setData] = useState<DistrictDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterBand, setFilterBand] = useState<'all' | 'Green' | 'Yellow' | 'Orange' | 'Red'>('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.getDistrictDashboard(districtId);
        setData(res.data);
      } catch (error) {
        console.error('Failed to load district dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [districtId]);

  const filteredVictims = data?.victims.filter((v) =>
    filterBand === 'all' || v.latest_band === filterBand
  ) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-48 bg-secondary-100 rounded" />
          <div className="h-4 w-96 bg-secondary-100 rounded" />
        </div>
        <div className="grid lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} padding="md">
              <div className="h-4 w-1/4 bg-secondary-100 rounded mb-4" />
              <div className="h-12 w-full bg-secondary-100 rounded" />
            </Card>
          ))}
        </div>
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
            <span>District Dashboard</span>
          </div>
          <h1 className="text-display-sm font-heading font-bold text-text-primary">{districtId}</h1>
          <p className="text-body text-text-secondary mt-1">
            {data?.total_victims} victims • {data?.high_risk_count} high risk • {(data?.band_distribution?.Orange ?? 0) + (data?.band_distribution?.Red ?? 0)} urgent
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export Report</Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card padding="md">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">Total Victims</p>
              <p className="text-display-sm font-heading font-bold text-text-primary">{data?.total_victims}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-500" />
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">Stable (Green)</p>
              <p className="text-display-sm font-heading font-bold text-distress-green">{data?.band_distribution.Green}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-distress-green/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-distress-green" />
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">Mild (Yellow)</p>
              <p className="text-display-sm font-heading font-bold text-distress-yellow">{data?.band_distribution.Yellow}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-distress-yellow/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-distress-yellow" />
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">Significant (Orange)</p>
              <p className="text-display-sm font-heading font-bold text-distress-orange">{data?.band_distribution.Orange}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-distress-orange/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-distress-orange" />
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">Urgent (Red)</p>
              <p className="text-display-sm font-heading font-bold text-distress-red">{data?.band_distribution.Red}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-distress-red/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-distress-red" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Band Distribution Chart + Victims Table */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.section className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card padding="none">
            <CardHeader className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Victims in {districtId}</CardTitle>
                <CardDescription>All victims with current distress status</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={filterBand} onChange={(e) => setFilterBand(e.target.value as 'all' | 'Green' | 'Yellow' | 'Orange' | 'Red')}>
                  <option value="all">All Bands</option>
                  <option value="Red">Red (Urgent)</option>
                  <option value="Orange">Orange (Significant)</option>
                  <option value="Yellow">Yellow (Mild)</option>
                  <option value="Green">Green (Stable)</option>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="table" role="table">
                  <thead>
                    <tr>
                      <th scope="col">Victim ID</th>
                      <th scope="col">Case Type</th>
                      <th scope="col">Score</th>
                      <th scope="col">Band</th>
                      <th scope="col">Trend</th>
                      <th scope="col">7-day Risk</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVictims.map((victim, i) => (
                      <motion.tr key={victim.victim_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <td className="font-mono text-body-sm">
                          <Link href={`/dashboard/victims/${victim.victim_id}`} className="text-primary-500 hover:text-primary-600">
                            {victim.victim_id}
                          </Link>
                        </td>
                        <td>{victim.case_type}</td>
                        <td>
                          <span className={cn('distress-score font-bold', `distress-score-${(victim.latest_band || 'Green').toLowerCase()}`)}>
                            {victim.latest_score?.toFixed(1) || '—'}
                          </span>
                        </td>
                        <td><DistressBandBadge band={victim.latest_band as any} size="sm" showScore={victim.latest_score ?? undefined} /></td>
                        <td>
                          <Badge variant={victim.trend === 'worsening' ? 'red' : victim.trend === 'improving' ? 'green' : 'gray'} size="sm">
                            {victim.trend || '—'}
                          </Badge>
                        </td>
                        <td>{victim.escalation_probability_7d ? `${Math.round(victim.escalation_probability_7d * 100)}%` : '—'}</td>
                        <td>
                          <Link href={`/dashboard/victims/${victim.victim_id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/alerts">
                <Button variant="secondary" fullWidth leftIcon={<AlertTriangle className="w-4 h-4" />}>
                  Review District Alerts
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline" fullWidth leftIcon={<TrendingUp className="w-4 h-4" />}>
                  View District Analytics
                </Button>
              </Link>
              <Button variant="outline" fullWidth leftIcon={<Download className="w-4 h-4" />}>
                Generate Weekly Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Band Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { band: 'Red', count: data?.band_distribution.Red, color: 'bg-distress-red' },
                { band: 'Orange', count: data?.band_distribution.Orange, color: 'bg-distress-orange' },
                { band: 'Yellow', count: data?.band_distribution.Yellow, color: 'bg-distress-yellow' },
                { band: 'Green', count: data?.band_distribution.Green, color: 'bg-distress-green' },
              ].map((item) => (
                <motion.div key={item.band} className="flex items-center justify-between p-3 rounded-xl bg-secondary-50" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color.replace('bg-', '') }} />
                    <span className="font-medium text-text-primary">{item.band}</span>
                    <Badge variant={item.band.toLowerCase() as any} size="sm">{item.count}</Badge>
                  </div>
                  <div className="w-32 h-2 bg-secondary-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color.replace('bg-', '') }}
                      initial={{ width: 0 }}
                      animate={{ width: `${data?.total_victims ? ((item.count ?? 0) / data.total_victims) * 100 : 0}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}
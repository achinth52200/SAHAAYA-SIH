'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  MapPin,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, DistressBandBadge, PriorityBadge, StatusBadge,
  Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import type { NationalDashboard } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<NationalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.getNationalDashboard();
        setData(res.data);
      } catch (error) {
        console.error('Failed to load national dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-48 bg-secondary-100 rounded" />
          <div className="h-4 w-96 bg-secondary-100 rounded" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card padding="md"><div className="h-64 bg-secondary-100 rounded" /></Card>
          <Card padding="md"><div className="h-64 bg-secondary-100 rounded" /></Card>
        </div>
      </div>
    );
  }

  // Chart data preparation
  const bandDistributionData = data ? [
    { name: 'Stable (Green)', value: data.band_distribution.Green, color: '#4E9E6B' },
    { name: 'Mild (Yellow)', value: data.band_distribution.Yellow, color: '#E8A23D' },
    { name: 'Significant (Orange)', value: data.band_distribution.Orange, color: '#E8703D' },
    { name: 'Urgent (Red)', value: data.band_distribution.Red, color: '#D9534F' },
  ].filter(d => d.value > 0) : [];

  const bandTotal = bandDistributionData.reduce((sum, d) => sum + d.value, 0);

  const stateData = data ? Object.entries(data.states).map(([state, bands]) => ({
    state,
    ...bands,
    total: bands.Green + bands.Yellow + bands.Orange + bands.Red,
    highRisk: bands.Orange + bands.Red,
  })).sort((a, b) => b.highRisk - a.highRisk).slice(0, 10) : [];

  const COLORS = ['#4E9E6B', '#E8A23D', '#E8703D', '#D9534F'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <PieChart className="w-4 h-4" />
            <span>National Analytics</span>
          </div>
          <h1 className="text-display-sm font-heading font-bold text-text-primary">National Overview</h1>
          <p className="text-body text-text-secondary mt-1">
            {data?.total_victims} victims across {data?.total_states} states • {data?.high_risk_count} high risk ({data?.high_risk_percentage}%)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </Select>
          <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export Report</Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
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
              <p className="text-body-sm text-text-secondary">States</p>
              <p className="text-display-sm font-heading font-bold text-text-primary">{data?.total_states}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-500" />
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">High Risk</p>
              <p className="text-display-sm font-heading font-bold text-distress-orange">{data?.high_risk_count}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-distress-orange/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-distress-orange" />
            </div>
          </CardContent>
        </Card>
        <Card padding="md">
          <CardContent className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary">High Risk %</p>
              <p className="text-display-sm font-heading font-bold text-distress-red">{data?.high_risk_percentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-distress-red/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-distress-red" />
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
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Band Distribution Pie Chart */}
        <motion.section className="lg:col-span-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Distress Band Distribution</CardTitle>
              <CardDescription>National distribution across all bands</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Total sits in the middle of the ring; the breakdown reads as a list below.
                  Outside slice labels collided with the legend and clipped at this height. */}
              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={bandDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={94}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {bandDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value.toString(), 'victims']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-display-sm font-bold leading-none text-text-primary tabular-nums">
                    {bandTotal}
                  </span>
                  <span className="mt-1 text-caption text-text-muted">victims</span>
                </div>
              </div>

              <ul className="mt-5 space-y-2.5 border-t border-border pt-4">
                {bandDistributionData.map((entry) => (
                  <li key={entry.name} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-body-sm text-text-secondary">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                      {entry.name}
                    </span>
                    <span className="text-body-sm font-medium text-text-primary tabular-nums">
                      {entry.value}
                      <span className="ml-2 text-text-muted">
                        {bandTotal > 0 ? Math.round((entry.value / bandTotal) * 100) : 0}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.section>

        {/* High Risk by State Bar Chart */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle>Top States by High Risk Count</CardTitle>
              <CardDescription>Orange + Red band victims per state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stateData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4D8D5" horizontal={false} />
                    <XAxis
                      type="number"
                      // Victim counts are integers — without this the axis renders 0.25, 0.5, 0.75
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#7A8D7F', fontFamily: 'Inter' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="state"
                      tick={{ fontSize: 11, fill: '#1F2A24', fontFamily: 'Inter' }}
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        value.toString(),
                        name === 'highRisk' ? 'High Risk' : name === 'Orange' ? 'Orange' : 'Red'
                      ]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar dataKey="Orange" stackId="risk" fill="#E8703D" />
                    <Bar dataKey="Red" stackId="risk" radius={[0, 4, 4, 0]} fill="#D9534F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* State Breakdown Table */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card padding="none">
          <CardHeader className="px-6 py-4 border-b border-border">
            <CardTitle>State-Level Breakdown</CardTitle>
            <CardDescription>Detailed band distribution by state</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="table" role="table">
                <thead>
                  <tr>
                    <th scope="col">State</th>
                    <th scope="col">Total Victims</th>
                    <th scope="col">Green</th>
                    <th scope="col">Yellow</th>
                    <th scope="col">Orange</th>
                    <th scope="col">Red</th>
                    <th scope="col">High Risk</th>
                    <th scope="col">High Risk %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data?.states || {}).map(([state, bands], i) => (
                    <motion.tr key={state} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td className="font-medium text-text-primary">{state}</td>
                      <td className="font-mono text-body-sm">{bands.Green + bands.Yellow + bands.Orange + bands.Red}</td>
                      <td><DistressBandBadge band="Green" size="sm" showScore={bands.Green} /></td>
                      <td><DistressBandBadge band="Yellow" size="sm" showScore={bands.Yellow} /></td>
                      <td><DistressBandBadge band="Orange" size="sm" showScore={bands.Orange} /></td>
                      <td><DistressBandBadge band="Red" size="sm" showScore={bands.Red} /></td>
                      <td className="font-bold text-distress-orange">{bands.Orange + bands.Red}</td>
                      <td>
                        <Badge variant={(bands.Orange + bands.Red) / (bands.Green + bands.Yellow + bands.Orange + bands.Red) > 0.3 ? 'red' : 'yellow'} size="sm">
                          {Math.round(((bands.Orange + bands.Red) / (bands.Green + bands.Yellow + bands.Orange + bands.Red)) * 100)}%
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
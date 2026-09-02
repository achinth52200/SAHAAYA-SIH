'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle,
  Filter,
  Search,
  ChevronDown,
  MoreVertical,
  Eye,
  UserPlus,
  Flag,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAlertStore } from '@/lib/store';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, StatusBadge, PriorityBadge, DistressBandBadge,
  Input, Button, Modal, ConfirmDialog
} from '@/components/ui';
import { RadialDistressGauge } from '@/components/charts/RadialDistressGauge';
import { cn, formatRelativeTime, formatDate } from '@/lib/utils';
import type { Alert } from '@/types';

const priorityAccent: Record<string, string> = {
  critical: 'border-l-distress-red',
  high: 'border-l-distress-orange',
  medium: 'border-l-distress-yellow',
  low: 'border-l-border',
};

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_review', label: 'In Review' },
  { value: 'intervention_decided', label: 'Action Decided' },
  { value: 'intervention_in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'false_positive', label: 'Dismissed' },
];

const priorityOptions = [
  { value: '', label: 'All Priority' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function AlertsPage() {
  const { alerts, setAlerts, isLoading, setLoading } = useAlertStore();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    band: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Alert | null>(null);
  const [generating, setGenerating] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getReviewAlerts({ limit: 200 });
      setAlerts(res.data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleGenerateAlerts = async () => {
    setGenerating(true);
    try {
      await api.generateAlerts();
      await loadAlerts();
    } catch (error) {
      console.error('Failed to generate alerts:', error);
    } finally {
      setGenerating(false);
    }
  };

  const filteredAlerts = alerts
    .filter((alert) => {
      if (filters.search && !alert.victim_id.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.priority && alert.priority !== filters.priority) return false;
      if (filters.band && alert.band !== filters.band) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Alert];
      const bVal = b[sortConfig.key as keyof Alert];
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-display-sm font-heading font-bold text-text-primary">Alerts Inbox</h1>
          <p className="text-body text-text-secondary mt-1">Review and manage distress alerts requiring human attention</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleGenerateAlerts} loading={generating} leftIcon={<AlertTriangle className="w-4 h-4" />}>
            Generate Alerts
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <Card padding="md">
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              placeholder="Search victim ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input w-auto min-w-[160px]"
          >
            {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="input w-auto min-w-[140px]"
          >
            {priorityOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={filters.band}
            onChange={(e) => setFilters({ ...filters, band: e.target.value })}
            className="input w-auto min-w-[140px]"
          >
            <option value="">All Bands</option>
            <option value="Red">Red</option>
            <option value="Orange">Orange</option>
            <option value="Yellow">Yellow</option>
            <option value="Green">Green</option>
          </select>
          <Button variant="ghost" onClick={() => setFilters({ search: '', status: '', priority: '', band: '' })} leftIcon={<X className="w-4 h-4" />}>
            Clear
          </Button>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card padding="none">
        <CardContent className="p-0">
          {filteredAlerts.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-text-muted">
              <AlertTriangle className="w-16 h-16 mx-auto text-border mb-4" />
              <h3 className="text-heading-md font-semibold text-text-secondary mb-2">No alerts found</h3>
              <p className="text-body text-text-muted">Try adjusting your filters or generate new alerts</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table" role="table">
                <thead>
                  <tr>
                    <th scope="col" className="w-10"><input type="checkbox" className="w-4 h-4 rounded border-border text-primary-500" /></th>
                    <th scope="col" onClick={() => handleSort('created_at')} className="cursor-pointer select-none flex items-center gap-1">
                      Created <ChevronDown className="w-4 h-4" />
                    </th>
                    <th scope="col">Alert ID</th>
                    <th scope="col" onClick={() => handleSort('victim_id')} className="cursor-pointer select-none">Victim</th>
                    <th scope="col" className="w-24 cursor-pointer select-none" onClick={() => handleSort('distress_score')}>Score</th>
                    <th scope="col" className="w-28 cursor-pointer select-none" onClick={() => handleSort('band')}>Band</th>
                    <th scope="col" className="w-28 cursor-pointer select-none" onClick={() => handleSort('priority')}>Priority</th>
                    <th scope="col" className="w-32 cursor-pointer select-none" onClick={() => handleSort('status')}>Status</th>
                    <th scope="col" className="w-32">Assigned To</th>
                    <th scope="col" className="w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, i) => (
                    <motion.tr
                      key={alert.alert_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn('border-l-4', priorityAccent[alert.priority])}
                    >
                      <td><input type="checkbox" className="w-4 h-4 rounded border-border text-primary-500" /></td>
                      <td className="text-body-sm text-text-secondary">{formatRelativeTime(alert.created_at)}</td>
                      <td className="font-mono text-body-sm">{alert.alert_id.slice(0, 12)}...</td>
                      <td>
                        <Link href={`/dashboard/victims/${alert.victim_id}`} className="font-mono text-body-sm text-primary-500 hover:text-primary-600">
                          {alert.victim_id}
                        </Link>
                      </td>
                      <td>
                        <RadialDistressGauge score={alert.distress_score} band={alert.band} size="xs" />
                      </td>
                      <td><DistressBandBadge band={alert.band as any} size="sm" /></td>
                      <td><PriorityBadge priority={alert.priority} size="sm" /></td>
                      <td><StatusBadge status={alert.status} size="sm" /></td>
                      <td className="text-body-sm text-text-secondary">{alert.assigned_to || '—'}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/alerts/${alert.alert_id}`}>
                            <Button variant="ghost" size="sm" className="px-2 py-1">View</Button>
                          </Link>
                          {alert.status === 'new' && (
                            <Button variant="ghost" size="sm" className="px-2 py-1" onClick={() => setSelectedAlert(alert)}>
                              Assign
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title="Assign Alert"
        description="Assign this alert to a counsellor or officer"
        size="sm"
      >
        {selectedAlert && (
          <form onSubmit={(e) => { e.preventDefault(); setSelectedAlert(null); }}>
            <div className="space-y-4">
              <p className="text-body text-text-secondary">Assign <strong className="text-text-primary">{selectedAlert.alert_id}</strong> for <strong className="text-text-primary">{selectedAlert.victim_id}</strong> ({selectedAlert.band} band, {selectedAlert.priority} priority)</p>
              <Input label="Assignee ID" placeholder="e.g., COUNSELLOR_001" required />
              <select className="input" required>
                <option value="counsellor">Counsellor</option>
                <option value="district_officer">District Officer</option>
                <option value="state_officer">State Officer</option>
              </select>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setSelectedAlert(null)}>Cancel</Button>
                <Button type="submit">Assign</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}